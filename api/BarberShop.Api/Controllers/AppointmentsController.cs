using BarberShop.Api.Data;
using BarberShop.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberShop.Api.Controllers;

[ApiController]
[Route("api/appointments")]
public sealed class AppointmentsController(BarberShopDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AppointmentResponse>>> GetAppointments(
        [FromQuery] DateTime? date,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Appointments
            .Include(appointment => appointment.Customer)
            .Include(appointment => appointment.Service)
            .AsQueryable();

        if (date is not null)
        {
            var day = DateTime.SpecifyKind(date.Value.Date, DateTimeKind.Utc);
            var nextDay = day.AddDays(1);
            query = query.Where(appointment => appointment.StartAt >= day && appointment.StartAt < nextDay);
        }

        var appointments = await query
            .OrderBy(appointment => appointment.StartAt)
            .Select(appointment => new AppointmentResponse(
                appointment.Id,
                appointment.Customer!.Name,
                appointment.Customer.Phone,
                appointment.Service!.Name,
                appointment.StartAt,
                appointment.EndAt,
                appointment.Status.ToString(),
                appointment.Notes))
            .ToListAsync(cancellationToken);

        return Ok(appointments);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentResponse>> CreateAppointment(CreateAppointmentRequest request, CancellationToken cancellationToken)
    {
        var service = await dbContext.Services
            .FirstOrDefaultAsync(item => item.Id == request.ServiceId && item.IsActive, cancellationToken);

        if (service is null)
        {
            return BadRequest(new { message = "Servico nao encontrado." });
        }

        var startAt = DateTime.SpecifyKind(request.StartAt, DateTimeKind.Utc);
        var endAt = startAt.AddMinutes(service.DurationMinutes);
        var hasConflict = await dbContext.Appointments.AnyAsync(appointment =>
            appointment.Status == AppointmentStatus.Scheduled &&
            startAt < appointment.EndAt &&
            endAt > appointment.StartAt,
            cancellationToken);

        if (hasConflict)
        {
            return Conflict(new { message = "Horario indisponivel para agendamento." });
        }

        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(item => item.Phone == request.CustomerPhone.Trim(), cancellationToken);

        if (customer is null)
        {
            customer = new Customer
            {
                Name = request.CustomerName.Trim(),
                Phone = request.CustomerPhone.Trim(),
                Email = request.CustomerEmail?.Trim()
            };
            dbContext.Customers.Add(customer);
        }

        var appointment = new Appointment
        {
            Customer = customer,
            Service = service,
            StartAt = startAt,
            EndAt = endAt,
            Notes = request.Notes?.Trim()
        };

        dbContext.Appointments.Add(appointment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetAppointments), new { id = appointment.Id }, new AppointmentResponse(
            appointment.Id,
            customer.Name,
            customer.Phone,
            service.Name,
            appointment.StartAt,
            appointment.EndAt,
            appointment.Status.ToString(),
            appointment.Notes));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateAppointmentStatusRequest request, CancellationToken cancellationToken)
    {
        var appointment = await dbContext.Appointments.FindAsync([id], cancellationToken);

        if (appointment is null)
        {
            return NotFound();
        }

        appointment.Status = request.Status;
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}

public sealed record CreateAppointmentRequest(
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    int ServiceId,
    DateTime StartAt,
    string? Notes);

public sealed record UpdateAppointmentStatusRequest(AppointmentStatus Status);

public sealed record AppointmentResponse(
    int Id,
    string CustomerName,
    string CustomerPhone,
    string ServiceName,
    DateTime StartAt,
    DateTime EndAt,
    string Status,
    string? Notes);

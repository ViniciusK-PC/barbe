using BarberShop.Api.Data;
using BarberShop.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberShop.Api.Controllers;

[ApiController]
[Route("api/services")]
public sealed class ServicesController(BarberShopDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Service>>> GetServices(CancellationToken cancellationToken)
    {
        var services = await dbContext.Services
            .Where(service => service.IsActive)
            .OrderBy(service => service.Price)
            .ToListAsync(cancellationToken);

        return Ok(services);
    }

    [HttpPost]
    public async Task<ActionResult<Service>> CreateService(CreateServiceRequest request, CancellationToken cancellationToken)
    {
        var service = new Service
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            IsActive = true
        };

        dbContext.Services.Add(service);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetServices), new { id = service.Id }, service);
    }
}

public sealed record CreateServiceRequest(string Name, string? Description, int DurationMinutes, decimal Price);

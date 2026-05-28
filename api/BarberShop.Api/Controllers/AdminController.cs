using BarberShop.Api.Data;
using BarberShop.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberShop.Api.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminController(BarberShopDbContext dbContext) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<AdminSummaryResponse>> GetSummary(CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var appointmentsToday = await dbContext.Appointments
            .CountAsync(item => item.StartAt >= today && item.StartAt < tomorrow && item.Status == AppointmentStatus.Scheduled, cancellationToken);

        var pendingOrders = await dbContext.Orders.CountAsync(item => item.Status == OrderStatus.Pending, cancellationToken);
        var productsLowStock = await dbContext.Products.CountAsync(item => item.IsActive && item.StockQuantity <= 5, cancellationToken);
        var monthlyRevenue = await dbContext.Orders
            .Where(item => item.CreatedAt >= new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc) && item.Status != OrderStatus.Cancelled)
            .SumAsync(item => item.Total, cancellationToken);

        return Ok(new AdminSummaryResponse(appointmentsToday, pendingOrders, productsLowStock, monthlyRevenue));
    }
}

public sealed record AdminSummaryResponse(int AppointmentsToday, int PendingOrders, int ProductsLowStock, decimal MonthlyRevenue);

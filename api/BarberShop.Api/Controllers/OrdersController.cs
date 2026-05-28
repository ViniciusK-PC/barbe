using BarberShop.Api.Data;
using BarberShop.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberShop.Api.Controllers;

[ApiController]
[Route("api/orders")]
public sealed class OrdersController(BarberShopDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> GetOrders(CancellationToken cancellationToken)
    {
        var orders = await dbContext.Orders
            .Include(order => order.Items)
            .ThenInclude(item => item.Product)
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => new OrderResponse(
                order.Id,
                order.CustomerName,
                order.CustomerPhone,
                order.Total,
                order.Status.ToString(),
                order.CreatedAt,
                order.Items.Select(item => new OrderItemResponse(item.Product!.Name, item.Quantity, item.UnitPrice, item.Total)).ToList()))
            .ToListAsync(cancellationToken);

        return Ok(orders);
    }

    [HttpPost]
    public async Task<ActionResult<OrderResponse>> CreateOrder(CreateOrderRequest request, CancellationToken cancellationToken)
    {
        if (request.Items.Count == 0)
        {
            return BadRequest(new { message = "Inclua pelo menos um produto no pedido." });
        }

        var productIds = request.Items.Select(item => item.ProductId).ToArray();
        var products = await dbContext.Products
            .Where(product => productIds.Contains(product.Id) && product.IsActive)
            .ToDictionaryAsync(product => product.Id, cancellationToken);

        var order = new Order
        {
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim()
        };

        foreach (var item in request.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
            {
                return BadRequest(new { message = $"Produto {item.ProductId} nao encontrado." });
            }

            if (item.Quantity <= 0 || product.StockQuantity < item.Quantity)
            {
                return BadRequest(new { message = $"Estoque insuficiente para {product.Name}." });
            }

            product.StockQuantity -= item.Quantity;

            order.Items.Add(new OrderItem
            {
                Product = product,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                Total = product.Price * item.Quantity
            });
        }

        order.Total = order.Items.Sum(item => item.Total);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new OrderResponse(
            order.Id,
            order.CustomerName,
            order.CustomerPhone,
            order.Total,
            order.Status.ToString(),
            order.CreatedAt,
            order.Items.Select(item => new OrderItemResponse(item.Product!.Name, item.Quantity, item.UnitPrice, item.Total)).ToList());

        return CreatedAtAction(nameof(GetOrders), new { id = order.Id }, response);
    }
}

public sealed record CreateOrderRequest(string CustomerName, string CustomerPhone, IReadOnlyList<CreateOrderItemRequest> Items);
public sealed record CreateOrderItemRequest(int ProductId, int Quantity);
public sealed record OrderResponse(int Id, string CustomerName, string CustomerPhone, decimal Total, string Status, DateTime CreatedAt, IReadOnlyList<OrderItemResponse> Items);
public sealed record OrderItemResponse(string ProductName, int Quantity, decimal UnitPrice, decimal Total);

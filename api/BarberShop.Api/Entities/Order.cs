namespace BarberShop.Api.Entities;

public sealed class Order
{
    public int Id { get; set; }
    public required string CustomerName { get; set; }
    public required string CustomerPhone { get; set; }
    public decimal Total { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<OrderItem> Items { get; set; } = [];
}

public enum OrderStatus
{
    Pending = 1,
    Paid = 2,
    Cancelled = 3
}

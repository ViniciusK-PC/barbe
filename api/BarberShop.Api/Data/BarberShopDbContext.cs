using BarberShop.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace BarberShop.Api.Data;

public sealed class BarberShopDbContext(DbContextOptions<BarberShopDbContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasIndex(customer => customer.Phone).IsUnique();
            entity.Property(customer => customer.Name).HasMaxLength(120).IsRequired();
            entity.Property(customer => customer.Phone).HasMaxLength(30).IsRequired();
        });

        modelBuilder.Entity<Service>(entity =>
        {
            entity.Property(service => service.Name).HasMaxLength(100).IsRequired();
            entity.Property(service => service.Description).HasMaxLength(300);
            entity.Property(service => service.Price).HasPrecision(10, 2);
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasIndex(appointment => appointment.StartAt);
            entity.HasOne(appointment => appointment.Customer)
                .WithMany(customer => customer.Appointments)
                .HasForeignKey(appointment => appointment.CustomerId);
            entity.HasOne(appointment => appointment.Service)
                .WithMany(service => service.Appointments)
                .HasForeignKey(appointment => appointment.ServiceId);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(product => product.Name).HasMaxLength(120).IsRequired();
            entity.Property(product => product.Description).HasMaxLength(400);
            entity.Property(product => product.Price).HasPrecision(10, 2);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(order => order.CustomerName).HasMaxLength(120).IsRequired();
            entity.Property(order => order.CustomerPhone).HasMaxLength(30).IsRequired();
            entity.Property(order => order.Total).HasPrecision(10, 2);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(item => item.UnitPrice).HasPrecision(10, 2);
            entity.Property(item => item.Total).HasPrecision(10, 2);
            entity.HasOne(item => item.Order)
                .WithMany(order => order.Items)
                .HasForeignKey(item => item.OrderId);
            entity.HasOne(item => item.Product)
                .WithMany(product => product.OrderItems)
                .HasForeignKey(item => item.ProductId);
        });

        Seed(modelBuilder);
    }

    private static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Service>().HasData(
            new Service { Id = 1, Name = "Corte masculino", Description = "Corte na tesoura ou maquina com acabamento.", DurationMinutes = 40, Price = 45, IsActive = true },
            new Service { Id = 2, Name = "Barba completa", Description = "Toalha quente, navalha e finalizacao.", DurationMinutes = 30, Price = 35, IsActive = true },
            new Service { Id = 3, Name = "Corte + barba", Description = "Combo completo para sair pronto.", DurationMinutes = 70, Price = 75, IsActive = true });

        modelBuilder.Entity<Product>().HasData(
            new Product { Id = 1, Name = "Pomada modeladora", Description = "Fixacao media com acabamento natural.", Price = 39.9m, StockQuantity = 18, IsActive = true },
            new Product { Id = 2, Name = "Oleo para barba", Description = "Hidrata e deixa a barba alinhada.", Price = 49.9m, StockQuantity = 12, IsActive = true },
            new Product { Id = 3, Name = "Shampoo de barba", Description = "Limpeza suave para uso diario.", Price = 34.9m, StockQuantity = 20, IsActive = true });
    }
}

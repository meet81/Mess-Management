using MessManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            // Ensure db is created
            if (context.Database.GetPendingMigrations().Any())
            {
                context.Database.Migrate();
            }

            // Seed Admin User if no users exist
            if (!context.Users.Any())
            {
                context.Users.Add(new User
                {
                    FullName = "System Admin",
                    Email = "admin@mess.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                });
                context.SaveChanges();
            }

            SeedRbac(context);

            // Seed Initial Weekly Menu if no menu exists
            if (!context.Menus.Any())
            {
                var defaultMenus = new Menu[]
                {
                    new Menu { DayOfWeek = "Monday", Breakfast = "Oats & Fruits", Lunch = "Paneer Butter Masala, Rice", Dinner = "Pasta, Salad" },
                    new Menu { DayOfWeek = "Tuesday", Breakfast = "Pancakes, Syrup", Lunch = "Soya Chunks Curry, Beans", Dinner = "Mixed Veg Stir Fry, Noodles" },
                    new Menu { DayOfWeek = "Wednesday", Breakfast = "Poha, Jalebi", Lunch = "Vegetable Biryani", Dinner = "Grilled Paneer, Veggies" },
                    new Menu { DayOfWeek = "Thursday", Breakfast = "Cereal, Milk", Lunch = "Lentil Soup, Bread", Dinner = "Pizza Slice, Salad" },
                    new Menu { DayOfWeek = "Friday", Breakfast = "Yogurt, Granola", Lunch = "Veggie Burgers, Fries", Dinner = "Dal Makhani, Roti" },
                    new Menu { DayOfWeek = "Saturday", Breakfast = "Aloo Paratha, Curd", Lunch = "Paneer Tikka, Naan", Dinner = "Fried Rice, Manchurian" },
                    new Menu { DayOfWeek = "Sunday", Breakfast = "Masala Dosa, Chutney", Lunch = "Chole Bhature, Rice", Dinner = "Light Sandwiches, Soup" }
                };

                context.Menus.AddRange(defaultMenus);
                context.SaveChanges();
            }

            if (!context.Vendors.Any())
            {
                context.Vendors.AddRange(
                    new Vendor
                    {
                        VendorName = "Fresh Farm Supplies",
                        ContactPerson = "Raj Patel",
                        MobileNumber = "9876543210",
                        Email = "freshfarm@example.com",
                        Address = "Main Market",
                        SuppliedItems = "Vegetables, Fruits"
                    },
                    new Vendor
                    {
                        VendorName = "Grain House",
                        ContactPerson = "Anita Sharma",
                        MobileNumber = "9876501234",
                        Email = "grainhouse@example.com",
                        Address = "Wholesale Yard",
                        SuppliedItems = "Rice, Wheat, Pulses"
                    },
                    new Vendor
                    {
                        VendorName = "Dairy Best",
                        ContactPerson = "Imran Khan",
                        MobileNumber = "9876512345",
                        Email = "dairybest@example.com",
                        Address = "Station Road",
                        SuppliedItems = "Milk, Curd, Paneer"
                    }
                );
                context.SaveChanges();
            }

            if (!context.InventoryItems.Any())
            {
                var vegetableVendorId = context.Vendors
                    .Where(v => v.VendorName == "Fresh Farm Supplies")
                    .Select(v => (int?)v.VendorId)
                    .FirstOrDefault();
                var grainVendorId = context.Vendors
                    .Where(v => v.VendorName == "Grain House")
                    .Select(v => (int?)v.VendorId)
                    .FirstOrDefault();
                var dairyVendorId = context.Vendors
                    .Where(v => v.VendorName == "Dairy Best")
                    .Select(v => (int?)v.VendorId)
                    .FirstOrDefault();

                context.InventoryItems.AddRange(
                    CreateInventoryItem("Rice", "Rice", 80, "kg", 25, 55, grainVendorId),
                    CreateInventoryItem("Wheat Flour", "Wheat", 60, "kg", 20, 42, grainVendorId),
                    CreateInventoryItem("Potato", "Vegetables", 45, "kg", 15, 28, vegetableVendorId),
                    CreateInventoryItem("Onion", "Vegetables", 35, "kg", 12, 32, vegetableVendorId),
                    CreateInventoryItem("Tomato", "Vegetables", 30, "kg", 10, 35, vegetableVendorId),
                    CreateInventoryItem("Mixed Vegetables", "Vegetables", 25, "kg", 8, 48, vegetableVendorId),
                    CreateInventoryItem("Paneer", "Dairy", 18, "kg", 6, 240, dairyVendorId),
                    CreateInventoryItem("Milk", "Dairy", 50, "L", 15, 58, dairyVendorId),
                    CreateInventoryItem("Curd", "Dairy", 20, "kg", 5, 75, dairyVendorId),
                    CreateInventoryItem("Cooking Oil", "Oil", 30, "L", 10, 145, grainVendorId),
                    CreateInventoryItem("Dal", "Pulses", 45, "kg", 15, 95, grainVendorId),
                    CreateInventoryItem("Spices", "Spices", 12, "kg", 3, 180, grainVendorId)
                );
                context.SaveChanges();
            }
            else
            {
                foreach (var item in context.InventoryItems.Where(i => i.SafetyStock == 0))
                {
                    item.SafetyStock = item.MinimumStock;
                }
                foreach (var item in context.InventoryItems)
                {
                    item.AlertWhenLowStock = true;
                    item.UseInMealPlanning = item.Category != "Cleaning Items" && item.Category != "Kitchen Items";
                    item.IsPerishable = item.Category == "Vegetables" || item.Category == "Fruits" || item.Category == "Dairy";
                }

                if (!context.InventoryItems.Any(i => i.ItemName == "Spices"))
                {
                    var grainVendorIdTemp = context.Vendors
                        .Where(v => v.VendorName == "Grain House")
                        .Select(v => (int?)v.VendorId)
                        .FirstOrDefault();
                    context.InventoryItems.Add(CreateInventoryItem("Spices", "Spices", 12, "kg", 3, 180, grainVendorIdTemp));
                }
                context.SaveChanges();
            }

            // Seed missing menu ingredients
            var vegId = context.Vendors
                .Where(v => v.VendorName == "Fresh Farm Supplies")
                .Select(v => (int?)v.VendorId)
                .FirstOrDefault();
            var grainId = context.Vendors
                .Where(v => v.VendorName == "Grain House")
                .Select(v => (int?)v.VendorId)
                .FirstOrDefault();
            var dairyId = context.Vendors
                .Where(v => v.VendorName == "Dairy Best")
                .Select(v => (int?)v.VendorId)
                .FirstOrDefault();

            var menuIngredients = new List<InventoryItem>
            {
                // Fruits
                CreateInventoryItem("Banana", "Fruits", 15, "dozen", 5, 60, vegId),
                CreateInventoryItem("Apple", "Fruits", 15, "kg", 5, 150, vegId),
                CreateInventoryItem("Dry Fruits", "Fruits", 10, "kg", 2, 800, vegId),

                // Vegetables
                CreateInventoryItem("Capsicum", "Vegetables", 15, "kg", 5, 60, vegId),
                CreateInventoryItem("Carrot", "Vegetables", 20, "kg", 6, 50, vegId),
                CreateInventoryItem("Cucumber", "Vegetables", 15, "kg", 5, 30, vegId),
                CreateInventoryItem("Lettuce", "Vegetables", 10, "kg", 3, 80, vegId),
                CreateInventoryItem("Green Beans", "Vegetables", 15, "kg", 5, 70, vegId),
                CreateInventoryItem("Cabbage", "Vegetables", 20, "kg", 6, 30, vegId),
                CreateInventoryItem("Curry Leaves", "Vegetables", 5, "kg", 1, 100, vegId),
                CreateInventoryItem("Beans", "Vegetables", 15, "kg", 5, 70, vegId),
                CreateInventoryItem("Peas", "Vegetables", 20, "kg", 5, 80, vegId),
                CreateInventoryItem("Garlic", "Vegetables", 10, "kg", 3, 140, vegId),
                CreateInventoryItem("Salad Vegetables", "Vegetables", 15, "kg", 5, 50, vegId),
                CreateInventoryItem("Coconut", "Vegetables", 20, "pcs", 5, 35, vegId),
                CreateInventoryItem("Green Chili", "Vegetables", 10, "kg", 2, 80, vegId),
                CreateInventoryItem("Potatoes", "Vegetables", 45, "kg", 15, 28, vegId),

                // Dairy
                CreateInventoryItem("Butter", "Dairy", 15, "kg", 4, 500, dairyId),
                CreateInventoryItem("Cream", "Dairy", 10, "kg", 3, 250, dairyId),
                CreateInventoryItem("Cheese", "Dairy", 20, "kg", 5, 450, dairyId),
                CreateInventoryItem("Yogurt", "Dairy", 25, "kg", 5, 90, dairyId),

                // Rice / Rice items
                CreateInventoryItem("Poha", "Rice", 30, "kg", 8, 60, grainId),
                CreateInventoryItem("Rice Batter", "Rice", 30, "kg", 8, 50, grainId),

                // Wheat / Flour / Grain items
                CreateInventoryItem("Flour", "Wheat", 40, "kg", 10, 40, grainId),
                CreateInventoryItem("Bread", "Wheat", 30, "packets", 8, 35, grainId),
                CreateInventoryItem("Pizza Base", "Wheat", 40, "pcs", 10, 25, grainId),
                CreateInventoryItem("Burger Buns", "Wheat", 50, "pcs", 15, 15, grainId),
                CreateInventoryItem("Maida Flour", "Wheat", 25, "kg", 8, 45, grainId),
                CreateInventoryItem("Corn Flour", "Wheat", 15, "kg", 4, 60, grainId),

                // Pulses
                CreateInventoryItem("Soya Chunks", "Pulses", 15, "kg", 4, 110, grainId),
                CreateInventoryItem("Lentils", "Pulses", 40, "kg", 10, 100, grainId),
                CreateInventoryItem("Black Lentils", "Pulses", 30, "kg", 10, 110, grainId),
                CreateInventoryItem("Chickpeas", "Pulses", 35, "kg", 10, 120, grainId),

                // Spices
                CreateInventoryItem("Biryani Masala", "Spices", 10, "kg", 2, 250, grainId),

                // Other / Breakfast / Sauce / Sweets
                CreateInventoryItem("Oats", "Other", 20, "kg", 5, 120, grainId),
                CreateInventoryItem("Sugar", "Other", 50, "kg", 15, 45, grainId),
                CreateInventoryItem("Honey", "Other", 10, "kg", 2, 300, grainId),
                CreateInventoryItem("Pasta", "Other", 25, "kg", 5, 90, grainId),
                CreateInventoryItem("Tomato Sauce", "Other", 15, "kg", 3, 120, grainId),
                CreateInventoryItem("Eggs", "Other", 120, "pcs", 30, 6, dairyId),
                CreateInventoryItem("Maple Syrup", "Other", 5, "L", 1, 400, grainId),
                CreateInventoryItem("Noodles", "Other", 20, "kg", 5, 80, grainId),
                CreateInventoryItem("Soy Sauce", "Other", 10, "L", 2, 150, grainId),
                CreateInventoryItem("Jalebi Batter", "Other", 10, "kg", 2, 120, grainId),
                CreateInventoryItem("Sugar Syrup", "Other", 10, "L", 2, 80, grainId),
                CreateInventoryItem("Granola", "Other", 15, "kg", 4, 280, grainId),
                CreateInventoryItem("Potato Patty", "Other", 60, "pcs", 15, 12, grainId),
                CreateInventoryItem("Cornflakes/Cereal", "Other", 25, "kg", 5, 150, grainId)
            };

            foreach (var item in menuIngredients)
            {
                if (!context.InventoryItems.Any(i => i.ItemName == item.ItemName))
                {
                    context.InventoryItems.Add(item);
                }
            }
            context.SaveChanges();

            if (!context.MenuIngredientMappings.Any())
            {
                AddMapping(context, "Potato Sabji", "Potato", 0.08m);
                AddMapping(context, "Potato Sabji", "Onion", 0.03m);
                AddMapping(context, "Potato Sabji", "Tomato", 0.03m);
                AddMapping(context, "Potato Sabji", "Cooking Oil", 0.01m);
                AddMapping(context, "Potato Sabji", "Spices", 0.004m);
                AddMapping(context, "Dal", "Dal", 0.06m);
                AddMapping(context, "Dal", "Tomato", 0.02m);
                AddMapping(context, "Dal", "Onion", 0.02m);
                AddMapping(context, "Dal", "Cooking Oil", 0.008m);
                AddMapping(context, "Dal", "Spices", 0.003m);
                AddMapping(context, "Rice", "Rice", 0.12m);
                AddMapping(context, "Roti", "Wheat Flour", 0.09m);
                AddMapping(context, "Vegetable Biryani", "Rice", 0.11m);
                AddMapping(context, "Vegetable Biryani", "Mixed Vegetables", 0.08m);
                AddMapping(context, "Paneer Butter Masala", "Paneer", 0.07m);
                AddMapping(context, "Paneer Butter Masala", "Tomato", 0.04m);
                AddMapping(context, "Paneer Butter Masala", "Onion", 0.03m);
                AddMapping(context, "Dal Makhani", "Dal", 0.07m);
                AddMapping(context, "Aloo Paratha", "Potato", 0.07m);
                AddMapping(context, "Aloo Paratha", "Wheat Flour", 0.08m);
                context.SaveChanges();
            }

            // Ensure all daily menus have their correct ingredients mapped (Monday - Sunday)
            // Monday
            EnsureMapping(context, "Oats & Fruits", "Oats", 0.05m);
            EnsureMapping(context, "Oats & Fruits", "Milk", 0.20m);
            EnsureMapping(context, "Oats & Fruits", "Banana", 0.08m);
            EnsureMapping(context, "Oats & Fruits", "Apple", 0.08m);
            EnsureMapping(context, "Oats & Fruits", "Dry Fruits", 0.02m);
            EnsureMapping(context, "Oats & Fruits", "Sugar", 0.015m);
            EnsureMapping(context, "Oats & Fruits", "Honey", 0.01m);

            EnsureMapping(context, "Paneer Butter Masala", "Paneer", 0.07m);
            EnsureMapping(context, "Paneer Butter Masala", "Tomato", 0.04m);
            EnsureMapping(context, "Paneer Butter Masala", "Onion", 0.03m);
            EnsureMapping(context, "Paneer Butter Masala", "Butter", 0.01m);
            EnsureMapping(context, "Paneer Butter Masala", "Cream", 0.01m);
            EnsureMapping(context, "Paneer Butter Masala", "Spices", 0.004m);

            EnsureMapping(context, "Rice", "Rice", 0.12m);

            EnsureMapping(context, "Pasta", "Pasta", 0.08m);
            EnsureMapping(context, "Pasta", "Tomato Sauce", 0.04m);
            EnsureMapping(context, "Pasta", "Onion", 0.02m);
            EnsureMapping(context, "Pasta", "Capsicum", 0.02m);

            EnsureMapping(context, "Salad", "Carrot", 0.02m);
            EnsureMapping(context, "Salad", "Cucumber", 0.03m);
            EnsureMapping(context, "Salad", "Lettuce", 0.02m);
            EnsureMapping(context, "Salad", "Salad Vegetables", 0.04m);

            // Tuesday
            EnsureMapping(context, "Pancakes", "Flour", 0.07m);
            EnsureMapping(context, "Pancakes", "Milk", 0.12m);
            EnsureMapping(context, "Pancakes", "Eggs", 0.50m);
            EnsureMapping(context, "Pancakes", "Sugar", 0.015m);
            EnsureMapping(context, "Pancakes", "Butter", 0.01m);

            EnsureMapping(context, "Syrup", "Maple Syrup", 0.025m);

            EnsureMapping(context, "Soya Chunks Curry", "Soya Chunks", 0.05m);
            EnsureMapping(context, "Soya Chunks Curry", "Onion", 0.03m);
            EnsureMapping(context, "Soya Chunks Curry", "Tomato", 0.03m);
            EnsureMapping(context, "Soya Chunks Curry", "Spices", 0.003m);

            EnsureMapping(context, "Beans", "Green Beans", 0.06m);
            EnsureMapping(context, "Beans", "Beans", 0.06m);

            EnsureMapping(context, "Mixed Veg Stir Fry", "Carrot", 0.03m);
            EnsureMapping(context, "Mixed Veg Stir Fry", "Capsicum", 0.03m);
            EnsureMapping(context, "Mixed Veg Stir Fry", "Cabbage", 0.04m);
            EnsureMapping(context, "Mixed Veg Stir Fry", "Onion", 0.02m);

            EnsureMapping(context, "Noodles", "Noodles", 0.08m);
            EnsureMapping(context, "Noodles", "Soy Sauce", 0.008m);
            EnsureMapping(context, "Noodles", "Onion", 0.02m);

            // Wednesday
            EnsureMapping(context, "Poha", "Poha", 0.06m);
            EnsureMapping(context, "Poha", "Onion", 0.02m);
            EnsureMapping(context, "Poha", "Potato", 0.02m);
            EnsureMapping(context, "Poha", "Curry Leaves", 0.002m);

            EnsureMapping(context, "Jalebi", "Jalebi Batter", 0.04m);
            EnsureMapping(context, "Jalebi", "Sugar Syrup", 0.03m);

            EnsureMapping(context, "Vegetable Biryani", "Rice", 0.11m);
            EnsureMapping(context, "Vegetable Biryani", "Carrot", 0.02m);
            EnsureMapping(context, "Vegetable Biryani", "Beans", 0.02m);
            EnsureMapping(context, "Vegetable Biryani", "Peas", 0.02m);
            EnsureMapping(context, "Vegetable Biryani", "Onion", 0.03m);
            EnsureMapping(context, "Vegetable Biryani", "Biryani Masala", 0.005m);

            EnsureMapping(context, "Grilled Paneer", "Paneer", 0.08m);
            EnsureMapping(context, "Grilled Paneer", "Spices", 0.004m);

            EnsureMapping(context, "Veggies", "Capsicum", 0.03m);
            EnsureMapping(context, "Veggies", "Onion", 0.03m);
            EnsureMapping(context, "Veggies", "Tomato", 0.03m);

            // Thursday
            EnsureMapping(context, "Cereal", "Cornflakes/Cereal", 0.05m);
            EnsureMapping(context, "Cereal", "Milk", 0.20m);
            EnsureMapping(context, "Cereal", "Sugar", 0.015m);

            EnsureMapping(context, "Milk", "Milk", 0.20m);

            EnsureMapping(context, "Lentil Soup", "Lentils", 0.06m);
            EnsureMapping(context, "Lentil Soup", "Onion", 0.02m);
            EnsureMapping(context, "Lentil Soup", "Tomato", 0.02m);
            EnsureMapping(context, "Lentil Soup", "Garlic", 0.005m);

            EnsureMapping(context, "Bread", "Bread", 0.10m);

            EnsureMapping(context, "Pizza Slice", "Pizza Base", 0.25m);
            EnsureMapping(context, "Pizza Slice", "Cheese", 0.04m);
            EnsureMapping(context, "Pizza Slice", "Tomato Sauce", 0.03m);
            EnsureMapping(context, "Pizza Slice", "Capsicum", 0.02m);
            EnsureMapping(context, "Pizza Slice", "Onion", 0.02m);

            // Friday
            EnsureMapping(context, "Yogurt", "Yogurt", 0.15m);

            EnsureMapping(context, "Granola", "Granola", 0.05m);
            EnsureMapping(context, "Granola", "Honey", 0.01m);
            EnsureMapping(context, "Granola", "Dry Fruits", 0.015m);

            EnsureMapping(context, "Veggie Burgers", "Burger Buns", 1.0m);
            EnsureMapping(context, "Veggie Burgers", "Potato Patty", 1.0m);
            EnsureMapping(context, "Veggie Burgers", "Lettuce", 0.015m);
            EnsureMapping(context, "Veggie Burgers", "Tomato", 0.02m);
            EnsureMapping(context, "Veggie Burgers", "Cheese", 0.02m);

            EnsureMapping(context, "Fries", "Potatoes", 0.15m);
            EnsureMapping(context, "Fries", "Potato", 0.15m);

            EnsureMapping(context, "Dal Makhani", "Black Lentils", 0.06m);
            EnsureMapping(context, "Dal Makhani", "Butter", 0.01m);
            EnsureMapping(context, "Dal Makhani", "Cream", 0.01m);
            EnsureMapping(context, "Dal Makhani", "Spices", 0.004m);

            EnsureMapping(context, "Roti", "Wheat Flour", 0.09m);

            // Saturday
            EnsureMapping(context, "Aloo Paratha", "Wheat Flour", 0.08m);
            EnsureMapping(context, "Aloo Paratha", "Potato", 0.07m);
            EnsureMapping(context, "Aloo Paratha", "Onion", 0.02m);
            EnsureMapping(context, "Aloo Paratha", "Spices", 0.003m);

            EnsureMapping(context, "Curd", "Curd", 0.10m);

            EnsureMapping(context, "Paneer Tikka", "Paneer", 0.08m);
            EnsureMapping(context, "Paneer Tikka", "Yogurt", 0.03m);
            EnsureMapping(context, "Paneer Tikka", "Spices", 0.004m);

            EnsureMapping(context, "Naan", "Maida Flour", 0.09m);
            EnsureMapping(context, "Naan", "Butter", 0.01m);

            EnsureMapping(context, "Fried Rice", "Rice", 0.12m);
            EnsureMapping(context, "Fried Rice", "Carrot", 0.02m);
            EnsureMapping(context, "Fried Rice", "Capsicum", 0.02m);
            EnsureMapping(context, "Fried Rice", "Soy Sauce", 0.008m);

            EnsureMapping(context, "Manchurian", "Cabbage", 0.06m);
            EnsureMapping(context, "Manchurian", "Corn Flour", 0.02m);
            EnsureMapping(context, "Manchurian", "Soy Sauce", 0.008m);

            // Sunday
            EnsureMapping(context, "Masala Dosa", "Rice Batter", 0.15m);
            EnsureMapping(context, "Masala Dosa", "Potato", 0.05m);
            EnsureMapping(context, "Masala Dosa", "Onion", 0.02m);
            EnsureMapping(context, "Masala Dosa", "Curry Leaves", 0.002m);

            EnsureMapping(context, "Chutney", "Coconut", 0.25m);
            EnsureMapping(context, "Chutney", "Green Chili", 0.005m);

            EnsureMapping(context, "Chole Bhature", "Chickpeas", 0.06m);
            EnsureMapping(context, "Chole Bhature", "Onion", 0.03m);
            EnsureMapping(context, "Chole Bhature", "Tomato", 0.03m);
            EnsureMapping(context, "Chole Bhature", "Flour", 0.08m);
            EnsureMapping(context, "Chole Bhature", "Spices", 0.004m);

            EnsureMapping(context, "Light Sandwiches", "Bread", 0.10m);
            EnsureMapping(context, "Light Sandwiches", "Butter", 0.01m);
            EnsureMapping(context, "Light Sandwiches", "Cucumber", 0.03m);
            EnsureMapping(context, "Light Sandwiches", "Tomato", 0.03m);
            EnsureMapping(context, "Light Sandwiches", "Cheese", 0.02m);

            EnsureMapping(context, "Soup", "Mixed Vegetables", 0.06m);

            context.SaveChanges();

            if (!context.MealVegetablePlans.Any() && context.InventoryItems.Any())
            {
                var today = DateTime.UtcNow.Date;
                AddStarterPlan(context, today, "Lunch", "Sample Lunch", "Rice", 12, 100, 10);
                AddStarterPlan(context, today, "Lunch", "Sample Lunch", "Dal", 6, 100, 10);
                AddStarterPlan(context, today.AddDays(1), "Lunch", "Tomorrow Lunch", "Rice", 12, 100, 10);
                AddStarterPlan(context, today.AddDays(1), "Lunch", "Tomorrow Lunch", "Mixed Vegetables", 8, 100, 10);
                context.SaveChanges();
            }

            // Seed System Settings
            if (!context.SystemSettings.Any())
            {
                var settings = new List<SystemSetting>
                {
                    // Organization Settings
                    new SystemSetting { SettingKey = "Org:Name", SettingValue = "Enterprise Cafeteria", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Org:MessName", SettingValue = "Main Mess", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Org:HostelName", SettingValue = "Royal Hostel", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Org:Logo", SettingValue = "", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Org:Email", SettingValue = "support@mess.com", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Org:Mobile", SettingValue = "9876543210", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Org:Address", SettingValue = "University Campus, Building A", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Org:GST", SettingValue = "22AAAAA0000A1Z5", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Org:RegNo", SettingValue = "REG123456", UpdatedBy = "System" },

                    // Meal Timing Settings
                    new SystemSetting { SettingKey = "Meal:Breakfast:Start", SettingValue = "07:00", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:Breakfast:End", SettingValue = "09:30", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:Breakfast:Grace", SettingValue = "15", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:Lunch:Start", SettingValue = "12:00", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:Lunch:End", SettingValue = "14:30", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:Lunch:Grace", SettingValue = "15", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:Dinner:Start", SettingValue = "19:00", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:Dinner:End", SettingValue = "21:30", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:Dinner:Grace", SettingValue = "15", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:AutoCloseAttendance", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:EnableLateEntry", SettingValue = "false", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Meal:EnableMealReminder", SettingValue = "true", UpdatedBy = "System" },

                    // QR Settings
                    new SystemSetting { SettingKey = "Qr:ExpiryTime", SettingValue = "60", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Qr:DuplicateScanInterval", SettingValue = "600", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Qr:MaxScanAttempts", SettingValue = "3", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Qr:Enable", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Qr:EnableFaceVerification", SettingValue = "false", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Qr:PreventDuplicate", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Qr:RequireLiveVerification", SettingValue = "false", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Qr:AutoMarkAttendance", SettingValue = "true", UpdatedBy = "System" },

                    // Inventory Settings
                    new SystemSetting { SettingKey = "Inventory:DefaultSafetyStock", SettingValue = "10", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Inventory:MinThreshold", SettingValue = "5", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Inventory:ExpiryAlertDays", SettingValue = "3", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Inventory:AutoVendorSuggestions", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Inventory:AutoDeduction", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Inventory:EnableLowStockAlert", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Inventory:EnableExpiryNotifications", SettingValue = "true", UpdatedBy = "System" },

                    // Notification Settings
                    new SystemSetting { SettingKey = "Notification:Email", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Notification:SMS", SettingValue = "false", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Notification:Push", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Notification:WhatsApp", SettingValue = "false", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Notification:Alert:LowStock", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Notification:Alert:VendorDelay", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Notification:Alert:MealChange", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Notification:Alert:Complaint", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Notification:Alert:SalaryGenerated", SettingValue = "true", UpdatedBy = "System" },

                    // Security Settings
                    new SystemSetting { SettingKey = "Security:SessionTimeout", SettingValue = "30", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Security:PasswordExpiry", SettingValue = "90", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Security:MaxLoginAttempts", SettingValue = "5", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Security:TwoFactor", SettingValue = "false", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Security:RoleBasedAccess", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Security:ActivityLogging", SettingValue = "true", UpdatedBy = "System" },
                    new SystemSetting { SettingKey = "Security:DeviceVerification", SettingValue = "false", UpdatedBy = "System" }
                };

                context.SystemSettings.AddRange(settings);
                context.SaveChanges();
            }

            // Seed/Update existing staff profiles if incomplete
            var staffList = context.Users.Where(u => u.Role == "Staff").ToList();
            bool modifiedAnyStaff = false;
            foreach (var staff in staffList)
            {
                if (string.IsNullOrEmpty(staff.SalaryType))
                {
                    staff.Department = "Kitchen";
                    staff.Designation = "Cook";
                    staff.JoiningDate = DateTime.UtcNow.AddMonths(-6);
                    staff.SalaryType = "Monthly Salary";
                    staff.BaseSalary = 18000;
                    staff.DailyWage = 600;
                    staff.OvertimeRate = 120;
                    staff.BankAccountDetails = "SBI A/C: 30491827364, IFSC: SBIN0001234";
                    staff.UpiId = $"{staff.FullName.Replace(" ", "").ToLower()}@okaxis";
                    staff.PanNumber = "ABCDE1234F";
                    staff.AadhaarNumber = "123456789012";
                    staff.EmploymentStatus = "Active";
                    modifiedAnyStaff = true;
                }
            }
            if (modifiedAnyStaff)
            {
                context.SaveChanges();
            }
        }

        private static InventoryItem CreateInventoryItem(
            string itemName,
            string category,
            decimal quantity,
            string unit,
            decimal minimumStock,
            decimal purchasePrice,
            int? vendorId)
        {
            return new InventoryItem
            {
                ItemName = itemName,
                Category = category,
                Quantity = quantity,
                Unit = unit,
                MinimumStock = minimumStock,
                SafetyStock = minimumStock,
                PurchasePrice = purchasePrice,
                VendorId = vendorId,
                StockStatus = quantity <= minimumStock ? "Low Stock" : "In Stock",
                IsPerishable = category == "Vegetables" || category == "Fruits" || category == "Dairy",
                AlertWhenLowStock = true,
                UseInMealPlanning = category != "Cleaning Items" && category != "Kitchen Items",
                CreatedBy = "System"
            };
        }

        private static void SeedRbac(AppDbContext context)
        {
            var modules = new[]
            {
                "Dashboard",
                "Menu",
                "Attendance",
                "Leave",
                "Payments",
                "Users",
                "Roles",
                "Payroll",
                "SystemSettings",
                "QrAttendance",
                "DigitalId",
                "Inventory",
                "DailyUsage",
                "Vendors",
                "OrderSuggestions",
                "VendorOrders",
                "Feedback"
            };

            var actions = new[] { "View", "Read", "Create", "Edit", "Update", "Delete", "Approve", "Export" };

            foreach (var module in modules)
            {
                foreach (var action in actions)
                {
                    EnsurePermission(context, module, action);
                }
            }
            context.SaveChanges();

            var existingModules = context.Permissions
                .Select(p => p.ModuleName)
                .Distinct()
                .ToList();

            foreach (var module in existingModules)
            {
                foreach (var action in actions)
                {
                    EnsurePermission(context, module, action);
                }
            }
            context.SaveChanges();

            EnsureRole(context, "Admin", "Full system access.", isSystemRole: true, modules, actions);
            EnsureRole(context, "Staff", "Operational staff access.", isSystemRole: true,
                new[] { "Dashboard", "Menu", "Attendance", "Leave", "Payments", "Payroll", "QrAttendance", "Inventory", "DailyUsage", "Vendors", "OrderSuggestions", "VendorOrders", "Feedback" },
                new[] { "View", "Read", "Create", "Edit", "Update", "Approve", "Export" });
            EnsureRole(context, "Student", "Student self-service access.", isSystemRole: true,
                new[] { "Dashboard", "Menu", "Attendance", "Leave", "Payments", "DigitalId", "Feedback" },
                new[] { "View", "Read", "Create" });
        }

        private static void EnsureRole(
            AppDbContext context,
            string roleName,
            string description,
            bool isSystemRole,
            IEnumerable<string> modules,
            IEnumerable<string> actions)
        {
            var role = context.Roles.FirstOrDefault(r => r.RoleName == roleName);
            if (role == null)
            {
                role = new AppRole
                {
                    RoleName = roleName,
                    Description = description,
                    Status = "Active",
                    IsSystemRole = isSystemRole,
                    AllowDashboardAccess = true
                };
                context.Roles.Add(role);
                context.SaveChanges();
            }

            var permissionIds = context.Permissions
                .Where(p => modules.Contains(p.ModuleName) && actions.Contains(p.PermissionType))
                .Select(p => p.PermissionId)
                .ToList();

            foreach (var permissionId in permissionIds)
            {
                if (!context.RolePermissions.Any(rp => rp.RoleId == role.RoleId && rp.PermissionId == permissionId))
                {
                    context.RolePermissions.Add(new RolePermission
                    {
                        RoleId = role.RoleId,
                        PermissionId = permissionId
                    });
                }
            }

            context.SaveChanges();
        }

        private static void EnsurePermission(AppDbContext context, string module, string action)
        {
            if (context.Permissions.Any(p => p.ModuleName == module && p.PermissionType == action))
            {
                return;
            }

            context.Permissions.Add(new Permission
            {
                ModuleName = module,
                PermissionType = action,
                DisplayName = $"{module} {action}"
            });
        }

        private static void AddStarterPlan(
            AppDbContext context,
            DateTime planDate,
            string mealType,
            string menuItem,
            string itemName,
            decimal requiredQuantity,
            int expectedStudents,
            int expectedStaff)
        {
            var item = context.InventoryItems.FirstOrDefault(i => i.ItemName == itemName);
            if (item == null) return;

            context.MealVegetablePlans.Add(new MealVegetablePlan
            {
                PlanDate = planDate,
                MealType = mealType,
                MenuItem = menuItem,
                VegetableId = item.InventoryId,
                VegetableName = item.ItemName,
                RequiredQuantity = requiredQuantity,
                Unit = item.Unit,
                ExpectedStudentCount = expectedStudents,
                ExpectedStaffCount = expectedStaff,
                TotalExpectedMealCount = expectedStudents + expectedStaff,
                CreatedBy = "System"
            });
        }

        private static void AddMapping(AppDbContext context, string menuItem, string ingredientName, decimal quantityPerPerson)
        {
            var item = context.InventoryItems.FirstOrDefault(i => i.ItemName == ingredientName);
            if (item == null) return;

            context.MenuIngredientMappings.Add(new MenuIngredientMapping
            {
                MenuItem = menuItem,
                MenuItemName = menuItem,
                IngredientId = item.InventoryId,
                IngredientName = item.ItemName,
                QuantityPerPerson = quantityPerPerson,
                Unit = item.Unit
            });
        }

        private static void EnsureMapping(AppDbContext context, string menuItem, string ingredientName, decimal quantityPerPerson)
        {
            if (context.MenuIngredientMappings.Any(m => m.MenuItem == menuItem && m.IngredientName == ingredientName)) return;
            AddMapping(context, menuItem, ingredientName, quantityPerPerson);
        }

    }
}

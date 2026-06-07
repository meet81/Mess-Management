using MessManagement.Api.Data;
using MessManagement.Api.Models;
using MessManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MessManagement.Api.Controllers
{
    [Route("api/vendor-order-suggestions")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")]
    public class VendorOrderSuggestionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SmartKitchenWorkflowService _workflow;

        public VendorOrderSuggestionsController(AppDbContext context, SmartKitchenWorkflowService workflow)
        {
            _context = context;
            _workflow = workflow;
        }

        [HttpGet]
        public async Task<IActionResult> GetSuggestions([FromQuery] DateTime? date = null)
        {
            var targetDate = date?.Date ?? DateTime.UtcNow.Date.AddDays(1);
            
            var suggestions = await _context.VendorOrderSuggestions
                .Where(s => s.OrderDate.Date == targetDate.Date)
                .OrderByDescending(s => s.OrderDate)
                .ThenBy(s => s.VegetableName)
                .ToListAsync();

            if (suggestions.Count == 0)
            {
                var suggestionsList = await _workflow.BuildVendorSuggestionsAsync(targetDate);
                
                var existing = await _context.VendorOrderSuggestions
                    .Where(s => s.OrderDate.Date == targetDate.Date)
                    .ToListAsync();
                _context.VendorOrderSuggestions.RemoveRange(existing);

                foreach (dynamic s in suggestionsList)
                {
                    _context.VendorOrderSuggestions.Add(new VendorOrderSuggestion
                    {
                        OrderDate = targetDate,
                        VegetableId = s.ingredientId,
                        VegetableName = s.ingredientName,
                        AvailableStock = s.availableStock,
                        NextDayRequiredQuantity = s.tomorrowRequiredQuantity,
                        SafetyStock = s.safetyStock,
                        SuggestedOrderQuantity = s.suggestedOrderQuantity,
                        PreferredVendorId = s.preferredVendorId,
                        PreferredVendorName = s.preferredVendorName,
                        LastPurchaseRate = s.lastPurchaseRate,
                        EstimatedCost = s.estimatedCost,
                        RecommendationStatus = s.recommendationStatus,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                suggestions = await _context.VendorOrderSuggestions
                    .Where(s => s.OrderDate.Date == targetDate.Date)
                    .OrderByDescending(s => s.OrderDate)
                    .ThenBy(s => s.VegetableName)
                    .ToListAsync();
            }

            return Ok(suggestions);
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateSuggestions([FromQuery] DateTime? date = null)
        {
            var targetDate = date?.Date ?? DateTime.UtcNow.Date.AddDays(1);
            
            // Build suggestions dynamically
            var suggestionsList = await _workflow.BuildVendorSuggestionsAsync(targetDate);
            
            // Clean up existing suggestions for this date
            var existing = await _context.VendorOrderSuggestions
                .Where(s => s.OrderDate.Date == targetDate.Date)
                .ToListAsync();
            _context.VendorOrderSuggestions.RemoveRange(existing);

            foreach (dynamic s in suggestionsList)
            {
                _context.VendorOrderSuggestions.Add(new VendorOrderSuggestion
                {
                    OrderDate = targetDate,
                    VegetableId = s.ingredientId,
                    VegetableName = s.ingredientName,
                    AvailableStock = s.availableStock,
                    NextDayRequiredQuantity = s.tomorrowRequiredQuantity,
                    SafetyStock = s.safetyStock,
                    SuggestedOrderQuantity = s.suggestedOrderQuantity,
                    PreferredVendorId = s.preferredVendorId,
                    PreferredVendorName = s.preferredVendorName,
                    LastPurchaseRate = s.lastPurchaseRate,
                    EstimatedCost = s.estimatedCost,
                    RecommendationStatus = s.recommendationStatus,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            var savedSuggestions = await _context.VendorOrderSuggestions
                .Where(s => s.OrderDate.Date == targetDate.Date)
                .ToListAsync();

            return Ok(savedSuggestions);
        }
    }
}

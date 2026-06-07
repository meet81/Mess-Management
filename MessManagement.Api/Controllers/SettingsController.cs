using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using MessManagement.Api.Data;
using MessManagement.Api.DTOs;
using MessManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/settings
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.SystemSettings
                .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

            return Ok(settings);
        }

        // PUT: api/settings/update
        [HttpPut("update")]
        public async Task<IActionResult> UpdateSettings([FromBody] SettingsUpdateDto dto)
        {
            if (dto?.Settings == null || !dto.Settings.Any())
            {
                return BadRequest("No settings to update");
            }

            var updatedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "Admin";

            foreach (var kvp in dto.Settings)
            {
                var setting = await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.SettingKey == kvp.Key);

                if (setting != null)
                {
                    setting.SettingValue = kvp.Value ?? string.Empty;
                    setting.UpdatedBy = updatedBy;
                    setting.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _context.SystemSettings.Add(new SystemSetting
                    {
                        SettingKey = kvp.Key,
                        SettingValue = kvp.Value ?? string.Empty,
                        UpdatedBy = updatedBy,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();

            var currentSettings = await _context.SystemSettings
                .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

            return Ok(currentSettings);
        }
    }
}

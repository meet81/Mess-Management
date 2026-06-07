using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MessManagement.Api.Models
{
    public class QrAttendance
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AttendanceId { get; set; }

        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public string MealType { get; set; } = string.Empty; // Breakfast, Lunch, Dinner

        [Required]
        public DateTime AttendanceDate { get; set; }

        [Required]
        public string AttendanceTime { get; set; } = string.Empty;

        public string? QrToken { get; set; }

        [Required]
        public string VerificationStatus { get; set; } = "Verified"; // Verified, Rejected

        public string? DeviceInfo { get; set; }
    }
}

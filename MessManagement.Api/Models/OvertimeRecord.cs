using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MessManagement.Api.Models
{
    public class OvertimeRecord
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OvertimeId { get; set; }

        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal OvertimeHours { get; set; }

        public DateTime OvertimeDate { get; set; }

        public string? ApprovedBy { get; set; }

        [Required]
        public string ApprovalStatus { get; set; } = "Pending"; // Pending, Approved, Rejected

        [Column(TypeName = "decimal(18,2)")]
        public decimal OvertimeRate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

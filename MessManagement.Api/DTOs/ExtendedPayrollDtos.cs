using System;

namespace MessManagement.Api.DTOs
{
    public class OvertimeRecordCreateDto
    {
        public decimal OvertimeHours { get; set; }
        public DateTime OvertimeDate { get; set; }
    }

    public class OvertimeApproveDto
    {
        public required string Status { get; set; } // Approved, Rejected
    }

    public class SalaryAdvanceCreateDto
    {
        public decimal AdvanceAmount { get; set; }
        public decimal RecoveryAmount { get; set; }
    }

    public class SalaryAdvanceApproveDto
    {
        public required string Status { get; set; } // Approved, Rejected
    }
}

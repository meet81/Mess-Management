using System;
using System.Collections.Generic;

namespace MessManagement.Api.DTOs
{
    public class SettingsUpdateDto
    {
        public required Dictionary<string, string> Settings { get; set; }
    }

    public class QrScanDto
    {
        public required string QrToken { get; set; }
        public string? DeviceInfo { get; set; }
    }

    public class PayrollGenerateDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
    }

    public class PayrollPayDto
    {
        public decimal Amount { get; set; }
        public required string PaymentMethod { get; set; }
        public string? TransactionId { get; set; }
    }
}

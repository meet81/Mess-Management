namespace MessManagement.Api.DTOs
{
    public class VendorDto
    {
        public required string VendorName { get; set; }
        public string? ContactPerson { get; set; }
        public required string MobileNumber { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? SuppliedItems { get; set; }
    }
}

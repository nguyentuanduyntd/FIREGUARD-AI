using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FireGuard.Infrastructure.Services
{
    public class GoogleMapsService : IGoogleMapsService
    {
        private readonly HttpClient _httpClient;
        private readonly string? _apiKey;
        private readonly ILogger<GoogleMapsService> _logger;

        public GoogleMapsService(HttpClient httpClient, IConfiguration configuration, ILogger<GoogleMapsService> logger)
        {
            _httpClient = httpClient;
            _apiKey = configuration["GoogleMaps:ApiKey"];
            _logger = logger;
        }

        public async Task<(double distanceKm, double durationMinutes)> GetDistanceAndDurationAsync(double lat1, double lon1, double lat2, double lon2)
        {
            try
            {
                // Sử dụng API OSRM (OpenStreetMap) thay cho Google Maps
                // OSRM format: lon,lat
                var url = $"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false";
                
                // OSRM requires a User-Agent header
                var requestMessage = new HttpRequestMessage(HttpMethod.Get, url);
                requestMessage.Headers.Add("User-Agent", "FireGuardAI-App/1.0");

                var response = await _httpClient.SendAsync(requestMessage);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("OSRM API returned error status: {Status}", response.StatusCode);
                    return CalculateHaversineFallback(lat1, lon1, lat2, lon2);
                }

                var content = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;

                var status = root.GetProperty("code").GetString();
                if (status != "Ok")
                {
                    _logger.LogWarning("OSRM API status: {Status}", status);
                    return CalculateHaversineFallback(lat1, lon1, lat2, lon2);
                }

                var routes = root.GetProperty("routes");
                if (routes.GetArrayLength() > 0)
                {
                    var route = routes[0];
                    var distanceValue = route.GetProperty("distance").GetDouble(); // in meters
                    var durationValue = route.GetProperty("duration").GetDouble(); // in seconds

                    double distKm = distanceValue / 1000.0;
                    double durMin = durationValue / 60.0;
                    return (distKm, durMin);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to call OSRM API. Using fallback.");
            }

            return CalculateHaversineFallback(lat1, lon1, lat2, lon2);
        }

        private (double, double) CalculateHaversineFallback(double lat1, double lon1, double lat2, double lon2)
        {
            double dLat = ToRadians(lat2 - lat1);
            double dLon = ToRadians(lon2 - lon1);

            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            double c = 2 * Math.Asin(Math.Sqrt(a));
            double R = 6371.0; // Earth radius in Km
            double distKm = R * c;

            // Estimate duration assuming average speed of 30 km/h
            double durMin = (distKm / 30.0) * 60.0;

            return (Math.Round(distKm, 2), Math.Round(durMin, 1));
        }

        private double ToRadians(double val)
        {
            return (Math.PI / 180) * val;
        }
    }
}

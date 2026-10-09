# Base image for running the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# SDK image for building the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["FireGuard.sln", "./"]
COPY ["src/FireGuard.Domain/FireGuard.Domain.csproj", "src/FireGuard.Domain/"]
COPY ["src/FireGuard.Application/FireGuard.Application.csproj", "src/FireGuard.Application/"]
COPY ["src/FireGuard.Infrastructure/FireGuard.Infrastructure.csproj", "src/FireGuard.Infrastructure/"]
COPY ["src/FireGuard.API/FireGuard.API.csproj", "src/FireGuard.API/"]
COPY ["tests/FireGuard.Tests/FireGuard.Tests.csproj", "tests/FireGuard.Tests/"]

RUN dotnet restore

# Copy all source files and build
COPY . .
WORKDIR "/src/src/FireGuard.API"
RUN dotnet build "FireGuard.API.csproj" -c Release -o /app/build

# Publish the app
FROM build AS publish
RUN dotnet publish "FireGuard.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
USER app
ENTRYPOINT ["dotnet", "FireGuard.API.dll"]

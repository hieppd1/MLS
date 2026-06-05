# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and restore
COPY ["backend/MLS.API/MLS.API.csproj", "backend/MLS.API/"]
COPY ["backend/MLS.Application/MLS.Application.csproj", "backend/MLS.Application/"]
COPY ["backend/MLS.Domain/MLS.Domain.csproj", "backend/MLS.Domain/"]
COPY ["backend/MLS.Infrastructure/MLS.Infrastructure.csproj", "backend/MLS.Infrastructure/"]
RUN dotnet restore "backend/MLS.API/MLS.API.csproj"

# Copy source and publish
COPY backend/ backend/
WORKDIR /src/backend/MLS.API
RUN dotnet publish -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# Media storage
RUN mkdir -p /opt/mls/media
VOLUME ["/opt/mls/media"]

EXPOSE 5009
ENTRYPOINT ["dotnet", "MLS.API.dll"]

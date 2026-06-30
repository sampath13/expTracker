FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY apps/api/ExpTracker.slnx ./
COPY apps/api/src/ExpTracker.Api/ExpTracker.Api.csproj src/ExpTracker.Api/
COPY apps/api/src/ExpTracker.Core/ExpTracker.Core.csproj src/ExpTracker.Core/
COPY apps/api/src/ExpTracker.Infrastructure/ExpTracker.Infrastructure.csproj src/ExpTracker.Infrastructure/

RUN dotnet restore ExpTracker.slnx

COPY apps/api/ ./
WORKDIR /src/src/ExpTracker.Api
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Development
ENTRYPOINT ["dotnet", "ExpTracker.Api.dll"]

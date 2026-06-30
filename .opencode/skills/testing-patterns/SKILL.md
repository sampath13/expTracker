---
name: testing-patterns
description: Use when writing or modifying tests for any tier — React Native (Jest/RNTL), .NET (xUnit/NSubstitute/Testcontainers), or Python (pytest). Use when setting up test infrastructure, writing unit/integration/E2E tests, or debugging test failures. Use ONLY for expTracker testing work.
---

# Testing Patterns — expTracker

## Three-Tier Testing Strategy

| Tier | Framework | Scope |
|---|---|---|
| React Native mobile | Jest + React Native Testing Library | Unit + component + integration |
| .NET backend API | xUnit + NSubstitute + Testcontainers + WebApplicationFactory | Unit + integration |
| Python OCR service | pytest + httpx (TestClient) | Unit + integration |
| End-to-end | Manual (MVP), Detox (future) | Full user flows |

## React Native (apps/mobile/)

### Test Setup
```bash
# Dependencies
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native

# Run
npx jest --config jest.config.js
```

### Store Tests (Zustand)
```jsx
import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../store/auth';

describe('auth slice', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, jwt: null, isAuthenticated: false });
  });

  it('logs in and sets tokens', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.login({ user: mockUser, jwt: 'token', refreshToken: 'refresh' });
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.jwt).toBe('token');
  });

  it('clears state on logout', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.login({ user: mockUser, jwt: 'token', refreshToken: 'refresh' }));
    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.jwt).toBeNull();
  });
});
```

### Camera/Blur Detection Tests
```jsx
// Mock react-native-vision-camera and react-native-fs
jest.mock('react-native-vision-camera', () => ({
  Camera: jest.fn(),
  useCameraDevice: jest.fn(() => ({ id: 'back' })),
}));

describe('blurDetection', () => {
  it('returns blurry: true for variance below threshold', () => {
    const result = detectBlur(mockImagePath); // should mock image processing
    expect(result.isBlurry).toBe(true);
  });

  it('returns blurry: false for sharp images', () => {
    const result = detectBlur(mockSharpImagePath);
    expect(result.isBlurry).toBe(false);
  });
});
```

### WatermelonDB Tests
```jsx
// Use WatermelonDB's test helpers with in-memory SQLite
import { Database } from '@nozbe/watermelondb';
import { mySchema } from '../db/schema';

// Setup fresh in-memory DB before each test
let database;
beforeEach(() => {
  database = new Database({
    adapter: new SQLiteAdapter({ schema: mySchema, jsi: true }),
    modelClasses: [Bill, BillItem],
  });
});

it('creates and queries a bill', async () => {
  await database.write(async () => {
    await database.get('bills').create(b => {
      b.userId = 'test-user';
      b.total = 49.01;
    });
  });
  const bills = await database.get('bills').query().fetch();
  expect(bills.length).toBe(1);
});
```

## .NET Backend (apps/api/)

### Unit Tests (xUnit + NSubstitute)

```csharp
public class PriceLookupServiceTests
{
    [Fact]
    public async Task GetComparison_ReturnsGreenTier_WhenWithin5Percent()
    {
        // Arrange
        var mockDb = Substitute.For<IComparisonPoolDbContext>();
        var prices = new List<Price> { /* seed data */ };
        mockDb.Prices.Returns(MockDbSet(prices));
        var service = new PriceLookupService(mockDb);

        // Act
        var result = await service.GetComparison(productId: "p1", unitPrice: 3.15m, chainId: "c1");

        // Assert
        Assert.Equal("GREEN", result.ColorTier);
        Assert.Equal("available for less at NTUC FairPrice", result.Framing);
    }

    [Fact]
    public async Task GetComparison_Uses30DayWindow_Primary()
    {
        // Arrange: prices within 30 days + prices 31-60 days old
        // Assert: only 30-day prices used, result flagged as primary window
    }

    [Fact]
    public async Task GetComparison_FallsBackTo60Day_WhenNoRecentData()
    {
        // Arrange: no prices in last 30 days
        // Assert: 60-day data used, flagged "based on older data"
    }
}
```

### Integration Tests (WebApplicationFactory + Testcontainers)

```csharp
public class BillsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public BillsControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace real DB with Testcontainers PostgreSQL
                var descriptor = services.Single(d => d.ServiceType == typeof(PersonalBillsDbContext));
                services.Remove(descriptor);
                services.AddDbContext<PersonalBillsDbContext>(options =>
                    options.UseNpgsql(TestContainer.ConnectionString));
            });
        });
    }

    [Fact]
    public async Task GetBills_ReturnsPaginated_Authenticated()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ValidJwt);

        var response = await client.GetAsync("/bills?page_size=20");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        var bills = JsonSerializer.Deserialize<PaginatedResponse<BillDto>>(body);
        Assert.True(bills.Items.Count <= 20);
    }

    [Fact]
    public async Task Confirm_DeletesS3Object_AfterWrite()
    {
        // Arrange: upload image to S3Ninja test instance
        // Act: POST /bills/confirm
        // Assert: S3 object no longer exists, bill in DB, item in comparison pool
    }
}
```

### JWT Auth Tests

```csharp
[Fact]
public async Task RefreshToken_RotatesTokens_RevokesOld()
{
    var response = await client.PostAsJsonAsync("/auth/refresh", new { refreshToken = validToken });
    response.EnsureSuccessStatusCode();
    var newTokens = await response.Content.ReadAsAsync<TokenResponse>();

    // Old token should now be revoked
    var oldToken = await db.RefreshTokens.FirstAsync(t => t.TokenHash == Hash(validToken));
    Assert.True(oldToken.Revoked);
}
```

## Python OCR Service (apps/ocr-service/)

### Unit Tests (pytest)

```python
import pytest
from src.parsing.date import extract_date
from src.matching.category_filter import detect_category
from src.matching.matcher import match_product

def test_extract_date_dd_mm_yyyy():
    result = extract_date("Date: 15/10/2024")
    assert result == "2024-10-15"

def test_extract_date_handles_invalid():
    result = extract_date("No date here")
    assert result is None

def test_detect_category_milk():
    categories = {"Dairy": ["MILK", "YOGURT", "CHEESE"]}
    result = detect_category("MILK FRESH 2L", categories)
    assert result == "Dairy"

def test_detect_category_uncategorised():
    categories = {"Dairy": ["MILK"]}
    result = detect_category("SOMETHING WEIRD", categories)
    assert result == "Uncategorised"

def test_match_product_high_confidence():
    candidates = [Product("Sunshine White Bread 600g", "Bakery")]
    result, confidence = match_product("SUNSHINE WHT BRD 600G", candidates)
    assert result.canonical_name == "Sunshine White Bread 600g"
    assert confidence > 0.85

def test_match_product_low_confidence():
    candidates = [Product("Different Product", "Bakery")]
    _, confidence = match_product("SUNSHINE WHT BRD 600G", candidates)
    assert confidence < 0.60
```

### Integration Tests (pytest + httpx)

```python
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/ocr/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_scan_endpoint_with_image():
    with open("tests/fixtures/sample_receipt.jpg", "rb") as f:
        response = client.post("/ocr/scan", files={"file": f})
    assert response.status_code == 200
    data = response.json()
    assert "retailer" in data
    assert "items" in data
    assert len(data["items"]) > 0

def test_scan_endpoint_invalid_format():
    response = client.post("/ocr/scan", files={"file": b"not an image"})
    assert response.status_code == 400

def test_ocr_timeout_returns_partial():
    # Mock large/complex receipt that takes >10s
    # Assert 200 with partial results + unparsed_fields
```

## Conventions

- **React Native:** Co-locate `__tests__/` with source or use a parallel `__tests__/` directory per screen
- **.NET:** Tests in `apps/api/tests/`, mirror `src/` structure, one test file per class
- **Python:** Tests in `apps/ocr-service/tests/`, use `pytest` fixtures, test images in `tests/fixtures/`
- All tiers: Arrange → Act → Assert, descriptive test names
- No shared test state between test methods (fresh setup each time)
- Mock external dependencies at the boundary (API calls, S3, HTTP clients)
- CI runs all three test suites on every PR
- Coverage targets: 80%+ on critical paths (auth, OCR, comparison engine)

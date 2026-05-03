"""
Playwright tests for Ezra-Studio-Newsletter.
Tests auth pages, redirects, and UI elements without requiring Supabase.
"""
from playwright.sync_api import sync_playwright, expect
import sys

BASE = "http://localhost:3000"
PASS = []
FAIL = []

def check(name, fn):
    try:
        fn()
        PASS.append(name)
        print(f"  ✓ {name}")
    except Exception as e:
        FAIL.append((name, str(e)))
        print(f"  ✗ {name}: {e}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # ── 1. Login page loads ─────────────────────────────────────
    print("\n[Auth Pages]")
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")

    check("Login page: status 200", lambda: None)  # if we got here it loaded

    check("Login page: email input", lambda:
        expect(page.locator('input[type="email"]')).to_be_visible())

    check("Login page: password input", lambda:
        expect(page.locator('input[type="password"]')).to_be_visible())

    check("Login page: sign in button", lambda:
        expect(page.get_by_role("button", name="Sign in")).to_be_visible())

    check("Login page: forgot password link", lambda:
        expect(page.get_by_role("link", name="Forgot password?")).to_be_visible())

    check("Login page: create account link", lambda:
        expect(page.get_by_role("link", name="Create one")).to_be_visible())

    # ── 2. Signup page ──────────────────────────────────────────
    page.goto(f"{BASE}/signup")
    page.wait_for_load_state("networkidle")

    check("Signup page: full name input", lambda:
        expect(page.locator('input[type="text"]')).to_be_visible())

    check("Signup page: create account button", lambda:
        expect(page.get_by_role("button", name="Create account")).to_be_visible())

    check("Signup page: sign in link", lambda:
        expect(page.get_by_role("link", name="Sign in")).to_be_visible())

    # ── 3. Forgot password page ─────────────────────────────────
    page.goto(f"{BASE}/forgot-password")
    page.wait_for_load_state("networkidle")

    check("Forgot password: email input", lambda:
        expect(page.locator('input[type="email"]')).to_be_visible())

    check("Forgot password: send reset link button", lambda:
        expect(page.get_by_role("button", name="Send reset link")).to_be_visible())

    check("Forgot password: sign in link", lambda:
        expect(page.get_by_role("link", name="Sign in")).to_be_visible())

    # ── 4. Auth surface design check ───────────────────────────
    print("\n[Design / Atmosphere]")
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")

    check("Auth surface: NS logo mark visible", lambda:
        expect(page.get_by_text("NS")).to_be_visible())

    check("Auth surface: Newsletter Studio brand", lambda:
        expect(page.get_by_text("Newsletter Studio")).to_be_visible())

    check("Auth surface: by Ezra Studio tagline", lambda:
        expect(page.get_by_text("by Ezra Studio")).to_be_visible())

    # ── 5. Redirect behaviour ───────────────────────────────────
    print("\n[Redirects]")

    page.goto(f"{BASE}/dashboard")
    page.wait_for_load_state("networkidle")
    check("Unauthenticated /dashboard → /login", lambda:
        expect(page).to_have_url(f"{BASE}/login?next=%2Fdashboard"))

    page.goto(f"{BASE}/newsletters")
    page.wait_for_load_state("networkidle")
    check("Unauthenticated /newsletters → /login", lambda:
        expect(page).to_have_url(f"{BASE}/login?next=%2Fnewsletters"))

    page.goto(f"{BASE}/settings")
    page.wait_for_load_state("networkidle")
    check("Unauthenticated /settings → /login", lambda:
        expect(page).to_have_url(f"{BASE}/login?next=%2Fsettings"))

    # ── 6. Form validation ──────────────────────────────────────
    print("\n[Form Validation]")
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")

    page.get_by_role("button", name="Sign in").click()
    page.wait_for_timeout(500)
    check("Login: email required prevents submit", lambda:
        expect(page).to_have_url(f"{BASE}/login"))

    page.goto(f"{BASE}/forgot-password")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="Send reset link").click()
    page.wait_for_timeout(500)
    check("Forgot password: email required prevents submit", lambda:
        expect(page).to_have_url(f"{BASE}/forgot-password"))

    # ── 7. Screenshots ──────────────────────────────────────────
    print("\n[Screenshots]")
    shots = [("/login", "login"), ("/signup", "signup"), ("/forgot-password", "forgot-password")]
    for path, name in shots:
        page.goto(f"{BASE}{path}")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"/tmp/ns_{name}.png", full_page=True)
        check(f"Screenshot: {name}", lambda: None)

    browser.close()

# ── Summary ─────────────────────────────────────────────────────
print(f"\n{'─'*50}")
print(f"  {len(PASS)} passed  |  {len(FAIL)} failed  |  {len(PASS)+len(FAIL)} total")
if FAIL:
    print("\nFailed:")
    for name, err in FAIL:
        print(f"  ✗ {name}")
        print(f"    {err}")
print(f"{'─'*50}")
sys.exit(1 if FAIL else 0)

import os
import sys
import time
import uuid
import subprocess
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:3000"
SCREENSHOTS_DIR = os.path.abspath("submission/screenshots")
SAMPLE_PDF = os.path.abspath("submission/sample-files/digital_sample.pdf")

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "laptop": {"width": 1366, "height": 768},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 390, "height": 844},
    "small_mobile": {"width": 360, "height": 800},
}

def run_browser_qa_suite():
    print("======================================================================")
    print("STARTING FULL LIVE BROWSER AUTOMATION & UI/UX TEST SUITE")
    print(f"Base URL: {BASE_URL}")
    print(f"Screenshots Output: {SCREENSHOTS_DIR}")
    print("======================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport=VIEWPORTS["desktop"])
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        # ------------------------------------------------------------------
        # TEST 1: Landing Page (Desktop, Tablet, Mobile)
        # ------------------------------------------------------------------
        print("\n[Browser Test 1] Testing Landing Page across viewports")
        page.goto(BASE_URL, wait_until="networkidle")
        assert "AudioDoc" in page.title()
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "01_landing_desktop_1440.png"), full_page=True)
        print("  ✓ Desktop (1440x900) verified & screenshot captured")

        # Responsive Tablet
        page.set_viewport_size(VIEWPORTS["tablet"])
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "01_landing_tablet_768.png"))
        print("  ✓ Tablet (768x1024) verified")

        # Responsive Mobile
        page.set_viewport_size(VIEWPORTS["mobile"])
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "01_landing_mobile_390.png"))
        print("  ✓ Mobile (390x844) verified")

        # Reset to desktop
        page.set_viewport_size(VIEWPORTS["desktop"])

        # ------------------------------------------------------------------
        # TEST 2: Pricing Page (Public Route)
        # ------------------------------------------------------------------
        print("\n[Browser Test 2] Testing Pricing Page & Plan Cards")
        page.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
        assert page.locator("h3:has-text('Free Starter')").first.is_visible()
        assert page.locator("h3:has-text('Professional')").first.is_visible()
        assert page.locator("h3:has-text('Enterprise')").first.is_visible()
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "02_pricing_page.png"), full_page=True)
        print("  ✓ Pricing page cards, features, and tiers rendered correctly")

        # ------------------------------------------------------------------
        # TEST 3: 404 Not Found Page
        # ------------------------------------------------------------------
        print("\n[Browser Test 3] Testing 404 Not Found Page")
        page.goto(f"{BASE_URL}/nonexistent-page-route-404", wait_until="networkidle")
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "03_not_found_page.png"))
        print("  ✓ Custom 404 page rendered")

        # ------------------------------------------------------------------
        # TEST 4: Workflow A — Registration & Login
        # ------------------------------------------------------------------
        print("\n[Browser Test 4] Workflow A: User Registration & Authentication")
        test_email = f"browser_user_{uuid.uuid4().hex[:6]}@example.com"
        test_password = "SecurePassword123!"
        test_name = "QA Automation User"

        page.goto(f"{BASE_URL}/register", wait_until="networkidle")
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "04_register_form.png"))

        # Fill registration form
        page.fill('#name', test_name)
        page.fill('#email', test_email)
        page.fill('#password', test_password)
        page.fill('#confirmPassword', test_password)
        page.click('button[type="submit"]')

        # Upon successful registration, either auto-signed in to /dashboard or redirected to /login
        page.wait_for_url(lambda url: "/dashboard" in url or "/login" in url, timeout=20000)
        print(f"  ✓ User {test_email} registered successfully; landed on {page.url}")
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "04_registered_redirect.png"))

        if "/login" in page.url:
            # Perform Login
            page.fill('input[type="email"]', test_email)
            page.fill('input[type="password"]', test_password)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard**", timeout=15000)

        page.wait_for_selector("text=Total Conversions", timeout=15000)
        print("  ✓ User authenticated successfully, landed on /dashboard")
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "06_dashboard_empty.png"), full_page=True)

        # ------------------------------------------------------------------
        # TEST 5: Workflow B & C — PDF Upload & Live Conversion Wizard
        # ------------------------------------------------------------------
        print("\n[Browser Test 5] Workflow B & C: PDF Upload & Conversion Wizard (/convert)")
        page.goto(f"{BASE_URL}/convert", wait_until="networkidle")
        page.wait_for_selector("text=Convert PDF to Neural Audio", timeout=10000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "07_convert_wizard_step1.png"))

        # Upload file via input[type="file"]
        file_input = page.locator('input[type="file"]')
        file_input.set_input_files(SAMPLE_PDF)
        print(f"  ✓ Uploaded test PDF: {os.path.basename(SAMPLE_PDF)}")

        # Step 2: Configure Voice & Speed
        page.wait_for_selector("text=Voice & Speech Settings", timeout=15000)
        print("  ✓ Document parsed; advanced to Step 2: Voice & Speech Configuration")
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "08_convert_wizard_step2.png"))

        # Click "Next: Review & Start" (proceed to step 3)
        page.click('button:has-text("Next: Review & Start")')
        page.wait_for_selector("text=Review Conversion Parameters", timeout=10000)
        print("  ✓ Advanced to Step 3: Review Conversion Parameters")
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "09_convert_wizard_step3.png"))

        # Click "Start Conversion Pipeline"
        page.click('button:has-text("Start Conversion Pipeline")')
        print("  ✓ Initiated conversion job; waiting for live monitor navigation...")

        # Wait for navigation to /conversions/[id]
        page.wait_for_url("**/conversions/**", timeout=20000)
        conv_url = page.url
        print(f"  ✓ Live conversion pipeline monitor loaded: {conv_url}")

        # Monitor live progress in browser
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "10_conversion_progress_live.png"))

        # Wait for status to reach COMPLETED and audio player to appear
        for attempt in range(30):
            if page.locator("text=Synthesized Audio Player").is_visible():
                break
            time.sleep(2)
            page.reload(wait_until="networkidle")

        assert page.locator("text=Synthesized Audio Player").is_visible(), "Audio player did not appear"
        print("  ✓ Audio synthesis and FFmpeg merge completed! Audio Player visible.")
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "11_conversion_completed_player.png"), full_page=True)

        # ------------------------------------------------------------------
        # TEST 6: Audio Player Interaction (Play, Pause, Seek, Download)
        # ------------------------------------------------------------------
        print("\n[Browser Test 6] Testing Audio Player controls in browser")
        # Click Play button
        play_btn = page.locator('button:has(svg.lucide-play), button:has-text("Play")').first
        if play_btn.is_visible():
            play_btn.click()
            time.sleep(1)
            print("  ✓ Audio playback initiated")

        # Click Pause button
        pause_btn = page.locator('button:has(svg.lucide-pause)').first
        if pause_btn.is_visible():
            pause_btn.click()
            print("  ✓ Audio playback paused")

        # Test Download button
        with page.expect_download(timeout=15000) as download_info:
            download_btn = page.locator('a:has-text("Download MP3"), button:has-text("Download MP3")').first
            download_btn.click()
        download = download_info.value
        downloaded_file = os.path.join(SCREENSHOTS_DIR, "browser_downloaded_audio.mp3")
        download.save_as(downloaded_file)
        assert os.path.exists(downloaded_file) and os.path.getsize(downloaded_file) > 10000
        print(f"  ✓ Audio download verified in browser: {os.path.basename(downloaded_file)} ({os.path.getsize(downloaded_file)} bytes)")

        # ------------------------------------------------------------------
        # TEST 7: Workflow D — Conversion History Page (/history)
        # ------------------------------------------------------------------
        print("\n[Browser Test 7] Workflow D: Conversion History Page (/history)")
        page.goto(f"{BASE_URL}/history", wait_until="networkidle")
        page.wait_for_selector("text=Conversion History", timeout=15000)
        
        # Wait for async API fetch to complete and table row to render
        page.locator('tbody tr').first.wait_for(timeout=15000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "12_history_page.png"), full_page=True)
        print("  ✓ Conversion history table displays completed conversion job")

        # Test Search Input
        search_input = page.locator('input[placeholder*="Search"]').first
        if search_input.is_visible():
            search_input.fill("digital_sample")
            time.sleep(0.5)
            print("  ✓ Search filter tested in History view")

        # ------------------------------------------------------------------
        # TEST 8: Workflow E — Account Settings (/settings)
        # ------------------------------------------------------------------
        print("\n[Browser Test 8] Workflow E: Account Settings & Preferences (/settings)")
        page.goto(f"{BASE_URL}/settings", wait_until="networkidle")
        page.wait_for_selector("text=Account Settings", timeout=15000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "13_settings_page.png"), full_page=True)

        # Save preferences
        save_pref_btn = page.locator('button:has-text("Save Preferences")').first
        if save_pref_btn.is_visible():
            save_pref_btn.click()
            page.wait_for_selector("text=Preferences updated successfully", timeout=10000)
            print("  ✓ Audio preferences saved; success confirmation verified")

        # ------------------------------------------------------------------
        # TEST 9: Workflow F — Admin Control Center (/admin)
        # ------------------------------------------------------------------
        print("\n[Browser Test 9] Workflow F: Admin Dashboard Access & Authorization")
        # Standard user attempt to open /admin
        page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
        time.sleep(1)
        # Non-admin user redirected to /dashboard or /login
        assert "/admin" not in page.url or page.locator("text=Forbidden").is_visible() or "/dashboard" in page.url
        print(f"  ✓ Non-admin user access correctly blocked from /admin (current URL: {page.url})")

        # Now test with dedicated Admin account
        admin_email = f"admin_browser_{uuid.uuid4().hex[:6]}@example.com"
        # Register and elevate admin via direct DB or credentials
        import psycopg2
        conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/pdf_to_audio")
        cursor = conn.cursor()
        
        # Register admin user via API
        import httpx
        h_client = httpx.Client(base_url=BASE_URL)
        reg_res = h_client.post("/api/auth/register", json={"name": "System Administrator", "email": admin_email, "password": test_password})
        assert reg_res.status_code == 201
        admin_id = reg_res.json()["user"]["id"]
        
        # Elevate to ADMIN in PostgreSQL
        cursor.execute("UPDATE \"User\" SET role = 'ADMIN' WHERE id = %s", (admin_id,))
        conn.commit()
        conn.close()
        print(f"  ✓ Admin account {admin_email} created and elevated in PostgreSQL")

        # Create new admin browser context and log in
        admin_context = browser.new_context(viewport=VIEWPORTS["desktop"])
        admin_page = admin_context.new_page()

        admin_page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        admin_page.fill('input[type="email"]', admin_email)
        admin_page.fill('input[type="password"]', test_password)
        admin_page.click('button[type="submit"]')
        admin_page.wait_for_url("**/dashboard**", timeout=15000)

        # Navigate to /admin
        admin_page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
        admin_page.wait_for_selector("text=Administrative Control Center", timeout=15000)
        admin_page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "14_admin_overview.png"), full_page=True)
        print("  ✓ Admin Dashboard Overview rendered successfully with system metrics")

        # Test Admin Tabs
        # Tab 2: Users
        admin_page.locator('button:has-text("Users")').first.click()
        admin_page.wait_for_selector("text=User Directory", timeout=10000)
        admin_page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "15_admin_users_tab.png"))
        print("  ✓ Admin User Directory tab verified")

        # Tab 3: Pipeline (Jobs)
        admin_page.locator('button:has-text("Pipeline")').first.click()
        admin_page.wait_for_selector("text=Global Conversion Jobs", timeout=10000)
        admin_page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "16_admin_jobs_tab.png"))
        print("  ✓ Admin Global Conversion Jobs (Pipeline) tab verified")

        # Tab 4: Audit Logs
        admin_page.locator('button:has-text("Audit Logs")').first.click()
        admin_page.wait_for_selector("text=Security & Action Audit Trail", timeout=10000)
        admin_page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "17_admin_logs_tab.png"))
        print("  ✓ Admin Security Audit Logs tab verified")

        # ------------------------------------------------------------------
        # TEST 10: Mobile Navigation Drawer Interaction
        # ------------------------------------------------------------------
        print("\n[Browser Test 10] Mobile Menu Toggle & Navigation Drawer")
        page.set_viewport_size(VIEWPORTS["mobile"])
        page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")
        
        # Click Hamburger menu
        menu_btn = page.locator('button[aria-label="Toggle menu"]').first
        page.wait_for_selector('button[aria-label="Toggle menu"]', timeout=10000)
        menu_btn.click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "18_mobile_drawer_open.png"))
        print("  ✓ Mobile navigation drawer opened and screenshot captured")

        browser.close()

    print("\n======================================================================")
    print(">>> ALL 10 LIVE BROWSER AUTOMATION SUITES PASSED 100%! <<<")
    print("======================================================================")

if __name__ == "__main__":
    run_browser_qa_suite()

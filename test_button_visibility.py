#!/usr/bin/env python3
"""
Test if the Next button is visible in Card 1 on S23 Ultra viewport
"""
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Load device configuration
with open('/Users/chiru/Desktop/hackathon/devices/s23-ultra.json', 'r') as f:
    device_config = json.load(f)

print(f"Testing on {device_config['device']} viewport:")
print(f"  Width: {device_config['viewport']['width']}")
print(f"  Height: {device_config['viewport']['height']}")
print()

# Set up Chrome options for mobile emulation
chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument('--headless')  # Run in headless mode
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

# Initialize driver
driver = webdriver.Chrome(options=chrome_options)

try:
    # Set viewport size
    driver.set_window_size(
        device_config['viewport']['width'],
        device_config['viewport']['height']
    )

    # Navigate to the app (adjust URL as needed)
    url = 'http://localhost:5174'  # Frontend port (Vite default)
    print(f"Navigating to {url}...")
    driver.get(url)

    # Wait for page to load
    time.sleep(2)

    print("Checking if we need to go through onboarding...")

    # Try to navigate directly to game screen URL
    game_url = url + '/#/game'  # or '/game' depending on routing
    print(f"Trying to navigate directly to game screen: {game_url}")
    driver.get(game_url)
    time.sleep(3)

    # If direct navigation doesn't work, go through onboarding
    # Check if we're on game screen or need onboarding
    try:
        game_screen_element = driver.find_element(By.CSS_SELECTOR, '[role="tablist"][aria-label="Game panels"]')
        print("✓ Already on game screen!")
    except:
        print("Not on game screen, need to complete onboarding...")
        # Go back to root
        driver.get(url)
        time.sleep(2)

        # Fill name
        try:
            name_input = driver.find_element(By.CSS_SELECTOR, 'input')
            name_input.send_keys("TestUser")
            time.sleep(0.5)
        except:
            pass

        # Find all buttons on page and click them in sequence to progress
        for attempt in range(15):  # Max 15 clicks to get through onboarding
            try:
                # Find all visible buttons
                buttons = driver.find_elements(By.TAG_NAME, 'button')
                visible_buttons = [b for b in buttons if b.is_displayed() and b.is_enabled()]

                if not visible_buttons:
                    print(f"  Attempt {attempt+1}: No visible buttons found")
                    break

                # Click the last button (usually Continue/Next/etc.)
                button_to_click = visible_buttons[-1]
                button_text = button_to_click.text or "Unknown"
                print(f"  Attempt {attempt+1}: Clicking '{button_text}'...")
                button_to_click.click()
                time.sleep(1.5)

                # Check if we reached game screen
                try:
                    driver.find_element(By.CSS_SELECTOR, '[role="tablist"][aria-label="Game panels"]')
                    print("✓ Reached game screen!")
                    break
                except:
                    continue

            except Exception as e:
                print(f"  Attempt {attempt+1}: Error - {str(e)[:50]}")
                time.sleep(1)
                continue

    # Wait for game screen to load
    print("Waiting for game screen to load...")
    time.sleep(2)

    # Try to find Card 1 (Scenario card)
    try:
        # Wait for the scenario card to be present
        card_nav = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[role="tablist"][aria-label="Game panels"]'))
        )
        print("✓ Found card navigation")

        # Click on the first card (Scenario) to ensure we're on Card 1
        scenario_button = driver.find_elements(By.CSS_SELECTOR, '[role="tab"]')[0]
        scenario_button.click()
        time.sleep(1)
        print("✓ Switched to Card 1 (Scenario)")

        # Now check for the scenario deck controls (Next/Back buttons)
        print("\nSearching for Next button...")

        # Look for the scenario deck controls container
        controls = driver.find_elements(By.CSS_SELECTOR, 'div[class*="scenarioDeckControls"]')

        if controls:
            print(f"✓ Found {len(controls)} controls container(s)")

            # Get the controls element
            controls_element = controls[0]

            # Check if it's visible
            is_visible = controls_element.is_displayed()
            print(f"  Controls visible: {is_visible}")

            # Get position and size
            location = controls_element.location
            size = controls_element.size

            print(f"  Controls location: x={location['x']}, y={location['y']}")
            print(f"  Controls size: width={size['width']}, height={size['height']}")

            # Check if it's within viewport
            viewport_height = device_config['viewport']['height']
            bottom_position = location['y'] + size['height']

            print(f"  Bottom position: {bottom_position}")
            print(f"  Viewport height: {viewport_height}")

            if bottom_position <= viewport_height:
                print("\n✅ SUCCESS: Next button is within Card 1 viewport!")
                is_within_viewport = True
            else:
                print(f"\n❌ FAIL: Next button is {bottom_position - viewport_height}px below viewport!")
                is_within_viewport = False

            # Find the actual Next button
            buttons = controls_element.find_elements(By.CSS_SELECTOR, 'button')
            print(f"\n  Found {len(buttons)} button(s) in controls:")
            for i, button in enumerate(buttons):
                text = button.text
                is_btn_visible = button.is_displayed()
                btn_location = button.location
                print(f"    Button {i+1}: '{text}' (visible: {is_btn_visible}, y: {btn_location['y']})")

            # Take a screenshot for debugging
            screenshot_path = '/Users/chiru/Desktop/hackathon/test_screenshot.png'
            driver.save_screenshot(screenshot_path)
            print(f"\n📸 Screenshot saved to: {screenshot_path}")

            # Exit with appropriate code
            exit(0 if is_within_viewport else 1)

        else:
            print("❌ Could not find scenario deck controls!")
            driver.save_screenshot('/Users/chiru/Desktop/hackathon/test_screenshot_error.png')
            exit(1)

    except TimeoutException:
        print("❌ Timeout: Could not find game screen elements")
        driver.save_screenshot('/Users/chiru/Desktop/hackathon/test_screenshot_timeout.png')
        exit(1)

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    driver.save_screenshot('/Users/chiru/Desktop/hackathon/test_screenshot_exception.png')
    exit(1)

finally:
    driver.quit()

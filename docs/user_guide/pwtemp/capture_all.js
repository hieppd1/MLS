// MLS - Capture all screenshots with real data
// Run: node capture_all.js
const { chromium } = require('playwright');
const path = require('path');

const SS  = 'D:\\HiepPD\\MLS\\docs\\user_guide\\screenshots';
const BASE = 'http://localhost:3000';

async function cap(page, name, delay = 2200) {
    try {
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(delay);
        await page.screenshot({ path: path.join(SS, name), fullPage: false });
        console.log(`  [OK] ${name}`);
    } catch(e) { console.error(`  [ERR] ${name}: ${e.message.slice(0,80)}`); }
}

async function login(page, email, pw) {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);
    // clear and fill
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(pw);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3500);
    console.log(`  >> Logged in as ${email}, url=${page.url()}`);
}

async function firstHref(page, selector) {
    try { return await page.locator(selector).first().getAttribute('href'); } catch { return null; }
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
        viewport: { width: 1400, height: 900 },
        deviceScaleFactor: 1
    });
    const page = await ctx.newPage();

    // ─────────────────────────────────────────────────────────────
    // PUBLIC (not logged in)
    // ─────────────────────────────────────────────────────────────
    console.log('\n=== PUBLIC ===');
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await cap(page, '01_homepage.png');

    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await cap(page, '02_login_page.png', 800);

    // Login page filled
    await page.locator('input[type="email"]').fill('admin01@gmail.com');
    await page.locator('input[type="password"]').fill('123@123aA');
    await cap(page, '02b_login_filled.png', 400);

    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
    await cap(page, '16_register.png');

    // ─────────────────────────────────────────────────────────────
    // STUDENT
    // ─────────────────────────────────────────────────────────────
    console.log('\n=== STUDENT ===');
    await login(page, 'sudent01@gmail.com', '123@123aA');

    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await cap(page, '04_homepage_loggedin.png');

    await page.goto(`${BASE}/courses`, { waitUntil: 'domcontentloaded' });
    await cap(page, '05_courses_list.png');

    // Course detail - grab first course link
    const courseHref = await firstHref(page, 'a[href^="/courses/"]');
    if (courseHref) {
        await page.goto(`${BASE}${courseHref}`, { waitUntil: 'domcontentloaded' });
        await cap(page, '06_course_detail.png');
        await page.evaluate(() => window.scrollBy(0, 700));
        await page.waitForTimeout(400);
        await cap(page, '06b_course_detail_scroll.png', 300);
    }

    await page.goto(`${BASE}/sach`, { waitUntil: 'domcontentloaded' });
    await cap(page, '07_books_list.png');

    // Book detail - grab first book link
    const bookHref = await firstHref(page, 'a[href^="/sach/"]');
    if (bookHref) {
        await page.goto(`${BASE}${bookHref}`, { waitUntil: 'domcontentloaded' });
        await cap(page, '07b_book_detail.png');
    }

    await page.goto(`${BASE}/thi-online`, { waitUntil: 'domcontentloaded' });
    await cap(page, '08_quiz_list.png');

    await page.goto(`${BASE}/placement-test`, { waitUntil: 'domcontentloaded' });
    await cap(page, '17_placement_test.png');

    await page.goto(`${BASE}/nhom`, { waitUntil: 'domcontentloaded' });
    await cap(page, '09_groups.png');

    await page.goto(`${BASE}/gio-hang`, { waitUntil: 'domcontentloaded' });
    await cap(page, '18_cart.png');

    await page.goto(`${BASE}/my-courses`, { waitUntil: 'domcontentloaded' });
    await cap(page, '19_my_courses.png');

    // Session player - find enrolled course then session
    let sessionPlayerUrl = null;
    const myCoursesHref = await firstHref(page, 'a[href^="/courses/"]');
    if (myCoursesHref) {
        await page.goto(`${BASE}${myCoursesHref}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        // look for "learn" / "học" / "start" button
        const learnHref = await firstHref(page, 'a[href^="/learn/"], a[href^="/hoc/"], a[href*="/sessions/"]');
        if (learnHref) {
            sessionPlayerUrl = learnHref;
        }
    }
    if (!sessionPlayerUrl) {
        // try /my-lesson
        await page.goto(`${BASE}/my-lesson`, { waitUntil: 'domcontentloaded' });
        await cap(page, '23_my_lesson.png');
    }
    if (sessionPlayerUrl) {
        await page.goto(`${BASE}${sessionPlayerUrl}`, { waitUntil: 'domcontentloaded' });
        await cap(page, '23_my_lesson.png', 3000);
        // scroll down to see assets area
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(500);
        await cap(page, '23b_session_assets.png', 300);
    }

    await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' });
    await cap(page, '15_profile.png');

    // ─────────────────────────────────────────────────────────────
    // TEACHER
    // ─────────────────────────────────────────────────────────────
    console.log('\n=== TEACHER ===');
    await login(page, 'teacher01@gmail.com', '123@123aA');

    await page.goto(`${BASE}/teacher`, { waitUntil: 'domcontentloaded' });
    await cap(page, '20_teacher_dashboard.png');

    await page.goto(`${BASE}/teacher/courses`, { waitUntil: 'domcontentloaded' });
    await cap(page, '20b_teacher_courses.png');

    // Teacher course detail
    const tcHref = await firstHref(page, 'a[href^="/teacher/courses/"]');
    let teacherModuleId = null;
    if (tcHref) {
        await page.goto(`${BASE}${tcHref}`, { waitUntil: 'domcontentloaded' });
        await cap(page, '20c_teacher_course_detail.png');
        // Grab module link
        const modHref = await firstHref(page, 'a[href^="/teacher/modules/"]');
        if (modHref) {
            teacherModuleId = modHref;
            await page.goto(`${BASE}${modHref}`, { waitUntil: 'domcontentloaded' });
            await cap(page, '20d_teacher_module_editor.png');
            // Grab session link
            const sesHref = await firstHref(page, 'a[href^="/teacher/sessions/"]');
            if (sesHref) {
                await page.goto(`${BASE}${sesHref}`, { waitUntil: 'domcontentloaded' });
                await cap(page, '20e_teacher_session_editor.png', 3000);
                // scroll down to see segments/assets
                await page.evaluate(() => window.scrollBy(0, 500));
                await page.waitForTimeout(400);
                await cap(page, '20f_teacher_session_segments.png', 300);
            }
        }
    }

    await page.goto(`${BASE}/teacher/quizzes`, { waitUntil: 'domcontentloaded' });
    await cap(page, '21_teacher_quizzes.png');

    // Quiz new form
    await page.goto(`${BASE}/teacher/quizzes/new`, { waitUntil: 'domcontentloaded' });
    await cap(page, '21b_teacher_quiz_new.png');

    await page.goto(`${BASE}/teacher/questions`, { waitUntil: 'domcontentloaded' });
    await cap(page, '22_teacher_questions.png');

    await page.goto(`${BASE}/teacher/opic`, { waitUntil: 'domcontentloaded' });
    await cap(page, '21c_teacher_opic.png');

    await page.goto(`${BASE}/teacher/vstep`, { waitUntil: 'domcontentloaded' });
    await cap(page, '21d_teacher_vstep.png');

    await page.goto(`${BASE}/teacher/chat/groups`, { waitUntil: 'domcontentloaded' });
    await cap(page, '21e_teacher_groups.png');

    // ─────────────────────────────────────────────────────────────
    // ADMIN
    // ─────────────────────────────────────────────────────────────
    console.log('\n=== ADMIN ===');
    await login(page, 'admin01@gmail.com', '123@123aA');

    await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
    await cap(page, '03_admin_dashboard.png');

    await page.goto(`${BASE}/admin/courses`, { waitUntil: 'domcontentloaded' });
    await cap(page, '10_admin_courses.png');

    // Admin course detail
    const acHref = await firstHref(page, 'a[href^="/admin/courses/"]');
    if (acHref) {
        await page.goto(`${BASE}${acHref}`, { waitUntil: 'domcontentloaded' });
        await cap(page, '10b_admin_course_detail.png', 2500);
        // Try clicking tabs to show more content
        try {
            const tabs = page.locator('[role="tab"], .tab-button, button[data-tab]');
            const tabCount = await tabs.count();
            if (tabCount > 1) {
                await tabs.nth(1).click(); // Media/Image tab
                await page.waitForTimeout(1000);
                await cap(page, '10c_admin_course_media.png', 500);
                if (tabCount > 2) {
                    await tabs.nth(2).click(); // Pricing tab
                    await page.waitForTimeout(1000);
                    await cap(page, '10d_admin_course_pricing.png', 500);
                }
            }
        } catch(e) {}
    }

    await page.goto(`${BASE}/admin/sach`, { waitUntil: 'domcontentloaded' });
    await cap(page, '11_admin_books.png');

    // Admin book detail
    const abHref = await firstHref(page, 'a[href^="/admin/sach/"]');
    if (abHref) {
        await page.goto(`${BASE}${abHref}`, { waitUntil: 'domcontentloaded' });
        await cap(page, '11b_admin_book_detail.png');
    }

    await page.goto(`${BASE}/admin/don-hang`, { waitUntil: 'domcontentloaded' });
    await cap(page, '12_admin_orders.png');

    await page.goto(`${BASE}/admin/vouchers`, { waitUntil: 'domcontentloaded' });
    await cap(page, '13_admin_vouchers.png');

    await page.goto(`${BASE}/admin/users`, { waitUntil: 'domcontentloaded' });
    await cap(page, '14_admin_users.png');

    await page.goto(`${BASE}/admin/chat/support`, { waitUntil: 'domcontentloaded' });
    await cap(page, '24_admin_chat_support.png', 3000);

    await page.goto(`${BASE}/admin/settings`, { waitUntil: 'domcontentloaded' });
    await cap(page, '25_admin_settings.png');

    await page.goto(`${BASE}/admin/settings/banners`, { waitUntil: 'domcontentloaded' });
    await cap(page, '25b_admin_banners.png');

    await page.goto(`${BASE}/admin/levels`, { waitUntil: 'domcontentloaded' });
    await cap(page, '26_admin_levels.png');

    await page.goto(`${BASE}/admin/roles`, { waitUntil: 'domcontentloaded' });
    await cap(page, '27_admin_roles.png');

    await page.goto(`${BASE}/admin/teachers`, { waitUntil: 'domcontentloaded' });
    await cap(page, '28_admin_teachers.png');

    await page.goto(`${BASE}/admin/content/approvals`, { waitUntil: 'domcontentloaded' });
    await cap(page, '29_admin_approvals.png');

    // Admin analytics tabs
    await page.goto(`${BASE}/admin/analytics`, { waitUntil: 'domcontentloaded' });
    await cap(page, '03b_admin_analytics.png');

    await browser.close();
    console.log('\n============================');
    console.log('  ALL SCREENSHOTS CAPTURED!');
    console.log('============================');
})();

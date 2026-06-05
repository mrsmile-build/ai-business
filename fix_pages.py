content = open('public/dashboard/app.js').read()

pages = [
    ('👤 Profile', 'settings', '← Back'),
    ('📊 Analytics', 'dashboard', '← Back'),
    ('📩 Leads', 'dashboard', '← Back'),
    ('🧠 AI Tools', 'dashboard', '← Back'),
    ('💳 Subscription', 'dashboard', '← Back'),
    ('⚙️ Settings', 'dashboard', '← Dashboard'),
    ('🆘 Support', 'dashboard', '← Back'),
]

for title, back, btn in pages:
    content = content.replace(
        f'      <h3>{title}</h3>',
        f'      ${{header("{title}","{back}")}}'
    )
    content = content.replace(
        f"\n\n      <button onclick=\"loadPage('{back}')\">{btn}</button>",
        ''
    )

open('public/dashboard/app.js', 'w').write(content)
print('All pages fixed!')

"""Собирает проекты заказчиков в эту папку (она же репозиторий daily-space.github.io).
Каждый проект: папка <id>/index.html = трекер + вход по почте + облако.
Запуск: python3 собрать.py, потом git add -A, commit, push."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FB = '10.14.1'
# id проекта → (файл трекера, название на экране входа)
PROJECTS = {
    'uyutnye-budni': ('~/Desktop/Клод код/Работа/Трекеры для клиентов/Уютные будни/уютные-будни.html', 'уютные будни'),
}
NOINDEX = '<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex">'

def build(pid, src, title):
    html = open(os.path.expanduser(src), encoding='utf-8').read()
    if 'name="robots"' not in html:
        html = html.replace('<meta name="viewport" content="width=device-width, initial-scale=1">', NOINDEX, 1)
    scripts = ('<script src="../firebase-config.js"></script>\n'
               f'<script src="https://www.gstatic.com/firebasejs/{FB}/firebase-app-compat.js"></script>\n'
               f'<script src="https://www.gstatic.com/firebasejs/{FB}/firebase-auth-compat.js"></script>\n'
               f'<script src="https://www.gstatic.com/firebasejs/{FB}/firebase-firestore-compat.js"></script>\n'
               f'<script src="../shared/ds-cloud.js" data-project="{pid}" data-title="{title}"></script>\n'
               '<script>\n(function(){')
    assert html.count('<script>\n(function(){') == 1, pid
    html = html.replace('<script>\n(function(){', scripts, 1)
    os.makedirs(os.path.join(HERE, pid), exist_ok=True)
    open(os.path.join(HERE, pid, 'index.html'), 'w', encoding='utf-8').write(html)
    print('собран', pid)

if __name__ == '__main__':
    for pid, (src, title) in PROJECTS.items():
        build(pid, src, title)
    if not os.path.exists(os.path.join(HERE, 'firebase-config.js')):
        print('ВНИМАНИЕ: нет firebase-config.js, вход работать не будет')

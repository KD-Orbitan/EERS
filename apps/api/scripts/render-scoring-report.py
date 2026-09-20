"""Render measured tables only; retain the report's manually reviewed analysis.

Run from any directory with Python 3. No third-party packages required.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FOLDER = ROOT / 'docs/bao-cao-do-an'
data = json.loads((FOLDER / 'du-lieu/kiem-chung-tinh-diem-v2.json').read_text(encoding='utf-8'))
for source in data['sources']:
    actual = hashlib.sha256((ROOT / source['path']).read_bytes()).hexdigest()
    if actual != source['sha256']:
        raise SystemExit(f"Source changed; rerun simulation first: {source['path']}")

LABELS = {
    'empty': 'Không có review', 'rejected_only': '100 × 5★, tất cả REJECTED',
    'five_1': '1 × 5★', 'five_10': '10 × 5★', 'five_100': '100 × 5★',
    'one_1': '1 × 1★', 'one_10': '10 × 1★', 'one_100': '100 × 1★',
    'four_100': '100 × 4★', 'base': 'Nền: 10 × 4★',
    'rejected_boost': 'Nền + 100 × 5★ REJECTED',
    'rejected_attack': 'Nền + 100 × 1★ REJECTED',
    'suspicious_boost': 'Nền + 100 × 5★ SUSPICIOUS',
    'suspicious_attack': 'Nền + 100 × 1★ SUSPICIOUS',
    'suspicious_only': '100 × 5★ SUSPICIOUS',
    'old_only': '100 × 5★ cũ 365 ngày',
    'low_trust_only': '100 × 5★, trust=0,1',
    'balanced': '10 × 2★ + 10 × 5★, cùng mới',
    'improving': 'Cải thiện: 10 × 2★ cũ + 10 × 5★ mới',
    'declining': 'Suy giảm: 10 × 5★ cũ + 10 × 2★ mới',
    'trusted_positive': '10 × 2★ trust=0,1 + 10 × 5★ trust=0,9',
    'trusted_negative': '10 × 2★ trust=0,9 + 10 × 5★ trust=0,1',
    'criteria_equal': '10 review [5,1], trọng số [1,1]',
    'criteria_3_to_1': '10 review [5,1], trọng số [3,1]',
    'criteria_scaled': '10 review [5,1], trọng số [30,10]',
}


def number(value, digits=2):
    return '—' if value is None else f'{value:.{digits}f}'.replace('.', ',')


def table(headers, rows):
    return '\n'.join([
        '| ' + ' | '.join(headers) + ' |',
        '| ' + ' | '.join(['---'] * len(headers)) + ' |',
        *['| ' + ' | '.join(str(cell) for cell in row) + ' |' for row in rows],
    ])


blocks = {'BASELINE': table(['Mã', 'Tình huống', 'v', 'ΣW', 'R', 'Điểm /100'], [
    [r['id'], LABELS[r['id']], r['contributingReviews'], number(r['weightSum'], 4), number(r['preBayesianScore'], 6),
     'Không xếp hạng' if r['score'] is None else number(r['score'])]
    for r in data['baseline']
])}
for marker, parameter, ids, headings in [
    ('M', 'bayesianM', ['five_1', 'four_100', 'base', 'suspicious_boost'], ['m', '1 × 5★', '100 × 4★', 'Nền 10 × 4★', 'Nền + 100 × 5★ nghi ngờ']),
    ('C', 'bayesianC', ['five_1', 'four_100', 'base'], ['C', '1 × 5★', '100 × 4★', 'Nền 10 × 4★']),
    ('DELTA', 'suspiciousDelta', ['base', 'suspicious_boost', 'suspicious_attack', 'suspicious_only'], ['δ', 'Nền', 'Nền + 100 × 5★ nghi ngờ', 'Nền + 100 × 1★ nghi ngờ', '100 × 5★ chỉ nghi ngờ']),
    ('DECAY', 'timeDecayLambda', ['balanced', 'improving', 'declining', 'old_only'], ['λ/ngày', 'Cùng mới', 'Cải thiện', 'Suy giảm', '100 × 5★ cũ']),
]:
    rows = []
    for sweep in data['sensitivity']:
        if sweep['parameter'] != parameter:
            continue
        scores = {r['id']: r['score'] for r in sweep['results']}
        rows.append([str(sweep['value']).replace('.', ','), *[number(scores[key]) for key in ids]])
    blocks[marker] = table(headings, rows)
blocks['TRUST'] = table(['Hồ sơ', 'Được duyệt n', 'Tuổi ngày a', 'Bị kiểm duyệt từ chối f', 'Trust'], [
    [p['id'], p['n'], p['a'], p['f'], number(p['trust'], 6)] for p in data['trust']
])
blocks['FRAUD'] = table(['Tổ hợp', 'Trust', 'Số review trước', 'Bản sao nguyên văn', 'FraudScore', 'Nhãn'], [
    [p['id'], number(p['trust']), p['preceding'], 'Có' if p['duplicate'] else 'Không', number(p['fraudScore'], 4), p['fraudStatus']]
    for p in data['fraud']
])
blocks['COORDINATED'] = table(['Số review', 'VALID', 'SUSPICIOUS', 'REJECTED', 'v', 'ΣW', 'Điểm /100'], [
    [r['totalReviews'], r['fraudCounts']['VALID'], r['fraudCounts']['SUSPICIOUS'], r['fraudCounts']['REJECTED'],
     r['contributingReviews'], number(r['weightSum'], 6), number(r['score'])] for r in data['coordinated']
])
previous = json.loads((FOLDER / 'du-lieu/kiem-chung-tinh-diem.json').read_text(encoding='utf-8'))
old_scores = {r['id']: r['score'] for r in previous['baseline']}
blocks['COMPARISON'] = table(['Tình huống', 'Trước sửa /100', 'Sau sửa /100'], [
    [LABELS[r['id']], 'Không xếp hạng' if old_scores[r['id']] is None else number(old_scores[r['id']]),
     'Không xếp hạng' if r['score'] is None else number(r['score'])]
    for r in data['baseline'] if r['id'] in [
        'five_1', 'four_100', 'base', 'rejected_boost', 'rejected_attack',
        'suspicious_boost', 'suspicious_attack', 'suspicious_only', 'five_100', 'old_only', 'low_trust_only',
    ]
])
path = FOLDER / '13-cai-tien-cong-thuc-tinh-diem.md'
report = path.read_text(encoding='utf-8')
for marker, content in blocks.items():
    begin, end = f'<!-- BEGIN {marker} -->', f'<!-- END {marker} -->'
    start, stop = report.index(begin) + len(begin), report.index(end)
    report = report[:start] + '\n\n' + content + '\n\n' + report[stop:]
path.write_text(report, encoding='utf-8')
print(f'Rendered {len(blocks)} measured tables.')

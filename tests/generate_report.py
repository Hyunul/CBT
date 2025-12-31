import csv
import json
import os
import platform
import datetime
import math
import subprocess

# 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SYNC_CSV = os.path.join(BASE_DIR, 'k6', 'sync_raw.csv')
ASYNC_CSV = os.path.join(BASE_DIR, 'k6', 'async_raw.csv')
OUTPUT_DIR = os.path.join(BASE_DIR, 'results')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'report.html')

STAGES = [
    (30, 100, "Warm-up (0-100 VU)"),
    (30, 500, "Load (100-500 VU)"),
    (30, 1000, "Stress (500-1000 VU)"),
    (30, 1500, "Spike (1000-1500 VU)"),
    (30, 0, "Cooldown")
]

def get_cpu_name():
    try:
        if platform.system() == "Windows":
            cmd = "powershell -NoProfile -Command \"Get-CimInstance -ClassName Win32_Processor | Select-Object -ExpandProperty Name\""
            cpu_name = subprocess.check_output(cmd, shell=True).decode('utf-8').strip()
            return cpu_name
        elif platform.system() == "Darwin":
            return subprocess.check_output(['sysctl', '-n', 'machdep.cpu.brand_string']).decode('utf-8').strip()
        elif platform.system() == "Linux":
            with open("/proc/cpuinfo", "r") as f:
                for line in f:
                    if "model name" in line:
                        return line.split(":")[1].strip()
    except:
        pass
    return platform.processor() or "Unknown Processor"

def get_memory_info():
    try:
        if platform.system() == "Windows":
            cmd = "powershell -NoProfile -Command \"Get-CimInstance -ClassName Win32_ComputerSystem | Select-Object -ExpandProperty TotalPhysicalMemory\""
            mem_bytes = float(subprocess.check_output(cmd, shell=True).decode('utf-8').strip())
            mem_gb = mem_bytes / (1024**3)
            return f"{mem_gb:.1f} GB"
        elif platform.system() == "Darwin":
            mem_bytes = int(subprocess.check_output(['sysctl', '-n', 'hw.memsize']).decode('utf-8').strip())
            return f"{mem_bytes / (1024**3):.1f} GB"
        elif platform.system() == "Linux":
            with open("/proc/meminfo", "r") as f:
                for line in f:
                    if "MemTotal" in line:
                        kb = int(line.split()[1])
                        return f"{kb / (1024**2):.1f} GB"
    except:
        pass
    return "Unknown RAM"

def load_csv_data(filepath):
    if not os.path.exists(filepath):
        return []
    data_points = []
    start_time = None
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            try:
                idx_metric = header.index('metric_name')
                idx_time = header.index('timestamp')
                idx_val = header.index('metric_value')
            except ValueError:
                return []
            for row in reader:
                if len(row) <= idx_val: continue
                if row[idx_metric] != 'http_req_duration': continue
                ts = int(float(row[idx_time]))
                val = float(row[idx_val])
                if start_time is None: start_time = ts
                data_points.append((ts - start_time, val))
    except:
        return []
    return data_points

def calculate_stage_stats(data):
    if not data: return []
    stats = []
    current_time = 0
    for duration, target_vu, label in STAGES:
        end_time = current_time + duration
        stage_data = sorted([d[1] for d in data if current_time <= d[0] < end_time])
        if stage_data:
            count = len(stage_data)
            stats.append({
                'label': label,
                'target_vu': target_vu,
                'avg': sum(stage_data) / count,
                'p95': stage_data[int(count * 0.95)],
                'max': stage_data[-1]
            })
        else:
            stats.append({'label': label, 'target_vu': target_vu, 'avg': 0, 'p95': 0, 'max': 0})
        current_time = end_time
    return stats

def generate_html():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    sync_raw = load_csv_data(SYNC_CSV)
    async_raw = load_csv_data(ASYNC_CSV)
    sync_stats = calculate_stage_stats(sync_raw)
    async_stats = calculate_stage_stats(async_raw)

    if not sync_stats:
         sync_stats = [{'label': s[2], 'p95': 0, 'target_vu': s[1]} for s in STAGES]
    if not async_stats:
         async_stats = [{'label': s[2], 'p95': 0, 'target_vu': s[1]} for s in STAGES]

    labels = [s['label'] for s in sync_stats[:-1]]
    sync_p95_data = [round(s['p95'], 2) for s in sync_stats[:-1]]
    async_p95_data = [round(s['p95'], 2) for s in async_stats[:-1]]

    spike_idx = 3 
    sync_final_p95 = sync_stats[spike_idx]['p95'] if len(sync_stats) > spike_idx else 0
    async_final_p95 = async_stats[spike_idx]['p95'] if len(async_stats) > spike_idx else 0
    improvement = (sync_final_p95 - async_final_p95) / sync_final_p95 * 100 if sync_final_p95 > 0 else 0
    winner = "Async (via Kafka)" if async_final_p95 < sync_final_p95 else "Sync (Direct Redis)"

    processor_info = get_cpu_name()
    memory_info = get_memory_info()

    table_rows = ""
    for s, a in zip(sync_stats[:-1], async_stats[:-1]):
        status_class = "bg-red-100 text-red-800" if s['p95'] > 5000 else ("bg-yellow-100 text-yellow-800" if s['p95'] > 2000 else "bg-green-100 text-green-800")
        status_text = "CRITICAL" if s['p95'] > 5000 else ("WARNING" if s['p95'] > 2000 else "STABLE")
        row = '<tr class="bg-white border-b hover:bg-gray-50">'
        row += f'<td class="px-6 py-4 font-medium text-gray-900">{s["label"]}</td>'
        row += f'<td class="px-6 py-4">{round(s["p95"], 1)} ms</td>'
        row += f'<td class="px-6 py-4 text-indigo-600 font-bold">{round(a["p95"], 1)} ms</td>'
        row += f'<td class="px-6 py-4"><span class="{status_class} text-xs font-medium px-2.5 py-0.5 rounded">{status_text}</span></td>'
        row += '</tr>'
        table_rows += row

    labels_json = json.dumps(labels)
    sync_data_json = json.dumps(sync_p95_data)
    async_data_json = json.dumps(async_p95_data)

    content = []
    content.append('<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>CBT High-Load Performance Report</title>')
    content.append('<script src="https://cdn.tailwindcss.com"></script><script src="https://cdn.jsdelivr.net/npm/chart.js"></script>')
    content.append('<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;700&display=swap" rel="stylesheet">')
    content.append('<style>body { font-family: "Pretendard", sans-serif; background: #f3f4f6; } .card { background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }</style></head>')
    content.append('<body class="p-6 md:p-12"><div class="max-w-6xl mx-auto"><header class="mb-12 text-center">')
    content.append(f'<h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">CBT 트래픽 부하 테스트 리포트</h1>')
    content.append(f'<p class="text-gray-500 mt-3 text-lg">트래픽 급증(Spike) 시나리오: Sync vs Async 안정성 비교</p>')
    content.append(f'<p class="text-gray-400 mt-2 text-sm max-w-2xl mx-auto">* Note: <strong>Step Stress Test</strong> 방식을 사용하여 VU를 100명에서 1500명까지 30초 단위로 증가시켰습니다.<br>데이터는 CSV 로그를 기반으로 구간별 재집계되었습니다.</p>')
    content.append(f'<div class="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full inline-block font-bold shadow-lg">Peak Load Winner: {winner} ({improvement:.1f}% Latency 개선)</div></header>')
    content.append('<div class="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6"><div class="p-6 bg-gray-50 rounded-xl border border-gray-200"><h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Hardware Spec</h3>')
    content.append(f'<div class="space-y-3 text-sm"><div class="flex justify-between"><span class="text-gray-400">Processor</span><span class="font-semibold text-gray-700">{processor_info}</span></div>')
    content.append(f'<div class="flex justify-between"><span class="text-gray-400">Memory (RAM)</span><span class="font-semibold text-gray-700">{memory_info}</span></div></div></div>')
    content.append('<div class="p-6 bg-gray-50 rounded-xl border border-gray-200"><h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Test Scenario (Step Stress)</h3>')
    content.append('<div class="space-y-3 text-sm"><div class="flex justify-between"><span class="text-gray-400">Max VUs</span><span class="font-semibold text-gray-700">1500 Users</span></div>')
    content.append('<div class="flex justify-between"><span class="text-gray-400">Duration</span><span class="font-semibold text-gray-700">2m 30s</span></div>')
    content.append('<div class="flex justify-between"><span class="text-gray-400">Stages</span><span class="font-semibold text-gray-700">100 -> 500 -> 1000 -> 1500 VU</span></div></div></div></div>')
    content.append('<div class="card p-8 mb-12"><h3 class="text-xl font-bold text-gray-800 mb-2">📈 VU 증가에 따른 응답 지연(Latency) 추이</h3>')
    content.append('<p class="text-sm text-gray-400 mb-6">동시 접속자가 늘어날 때 응답 속도가 얼마나 느려지는지를 보여줍니다. (P95 기준, 낮을수록 좋음)</p>')
    content.append('<div class="h-96"><canvas id="trendChart"></canvas></div></div>')
    content.append('<div class="card p-8 overflow-hidden"><h3 class="text-lg font-bold text-gray-800 mb-6">📊 구간별 상세 데이터 (P95 Latency)</h3>')
    content.append(f'<div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-500"><thead class="text-xs text-gray-700 uppercase bg-gray-50"><tr><th class="px-6 py-3">Stage (Load)</th><th class="px-6 py-3">Sync (Redis)</th><th class="px-6 py-3">Async (Kafka)</th><th class="px-6 py-3">Status</th></tr></thead><tbody>{table_rows}</tbody></table></div></div></div>')
    content.append('<script>Chart.defaults.font.family = "Pretendard"; const ctx = document.getElementById("trendChart").getContext("2d"); new Chart(ctx, { type: "line", data: {')
    
    content.append('labels: ' + labels_json + ', datasets: [')
    content.append('{ label: "Sync (Direct Redis)", data: ' + sync_data_json + ', borderColor: "#ef4444", backgroundColor: "#ef4444", tension: 0.3, pointRadius: 6, pointHoverRadius: 8 },')
    content.append('{ label: "Async (via Kafka)", data: ' + async_data_json + ', borderColor: "#6366f1", backgroundColor: "#6366f1", tension: 0.3, pointRadius: 6, pointHoverRadius: 8 }')
    
    content.append(']}, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: "Latency (ms)" }, grid: { color: "#f3f4f6" } }, x: { grid: { display: false } } },')
    content.append('plugins: { tooltip: { mode: "index", intersect: false, padding: 10, backgroundColor: "rgba(0,0,0,0.8)" }, legend: { position: "top", labels: { usePointStyle: true, padding: 20 } } } } });')
    content.append('</script></body></html>')

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("".join(content))
    print(f"Report generated: {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_html()
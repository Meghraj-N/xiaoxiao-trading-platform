import sys
import json
from graphify.detect import detect
from pathlib import Path

# INPUT_PATH is the current directory (.)
result = detect(Path('.'))
with open('graphify-out/.graphify_detect.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False)
print(f"Total files: {result['total_files']}")

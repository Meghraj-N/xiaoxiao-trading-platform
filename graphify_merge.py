import sys
import json
from graphify.build import build_merge
from pathlib import Path

ast_file = Path('graphify-out/.graphify_ast.json')
sem_file = Path('graphify-out/.graphify_semantic.json')
cache_file = Path('graphify-out/.graphify_cached.json')

ast_data = json.loads(ast_file.read_text(encoding='utf-8')) if ast_file.exists() else {}
sem_data = json.loads(sem_file.read_text(encoding='utf-8')) if sem_file.exists() else {}
cache_data = json.loads(cache_file.read_text(encoding='utf-8')) if cache_file.exists() else {}

fragments = []
if ast_data: fragments.append(ast_data)
if sem_data: fragments.append(sem_data)
if cache_data: fragments.append(cache_data)

build_merge(fragments, graph_path='graphify-out/graph.json')
print("Graph built successfully.")

#!/usr/bin/env python3
import os, runpy, sys
root = os.popen('git rev-parse --show-toplevel 2>/dev/null').read().strip() or os.getcwd()
target = os.path.join(root, '.codex', 'hooks', 'secrets_guard.py')
if os.path.exists(target):
    runpy.run_path(target, run_name='__main__')
sys.exit(0)

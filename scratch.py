import os
import re

directory = '/Users/zaid/Desktop/PROJECTS/opsecho--1--main/src'

replacements = [
    # Backgrounds
    (r'bg-zinc-50', 'bg-bg-primary'),
    (r'dark:bg-\[\#0a0a0a\]', 'dark:bg-bg-primary'),
    (r'dark:bg-\[\#060606\]', 'dark:bg-bg-primary'),
    (r'dark:bg-\[\#03050a\]', 'dark:bg-bg-primary'),
    (r'bg-white', 'bg-bg-surface'),
    (r'bg-white/\d+', 'bg-bg-surface'),
    (r'dark:bg-zinc-900', 'dark:bg-bg-surface'),
    (r'dark:bg-zinc-800', 'dark:bg-bg-surface'),
    (r'dark:bg-black/\d+', 'dark:bg-bg-surface'),
    (r'bg-zinc-100', 'bg-bg-surface'),
    (r'bg-zinc-200', 'bg-bg-surface'),
    
    # Text
    (r'text-zinc-900', 'text-text-primary'),
    (r'dark:text-white', 'dark:text-text-primary'),
    (r'text-zinc-500', 'text-text-muted'),
    (r'text-zinc-400', 'text-text-muted'),
    (r'text-zinc-600', 'text-text-muted'),
    (r'text-indigo-400', 'text-accent'),
    (r'text-indigo-500', 'text-accent'),
    (r'text-blue-500', 'text-accent'),
    (r'text-blue-400', 'text-accent'),
    (r'text-blue-600', 'text-accent'),
    
    # Borders
    (r'border-zinc-200', 'border-border-subtle'),
    (r'border-white/\d+', 'border-border-subtle'),
    (r'border-indigo-500/20', 'border-border-subtle'),
    (r'border-indigo-500/30', 'border-border-glow'),
    
    # States (Fact, Hypo, Action, Conflict)
    # The existing colors for these might be blue, amber, red
    (r'text-red-500', 'text-state-conflict'),
    (r'text-red-400', 'text-state-conflict'),
    (r'bg-red-500', 'bg-state-conflict'),
    (r'border-red-500', 'border-state-conflict'),
    (r'text-emerald-500', 'text-state-fact'),
    (r'text-emerald-400', 'text-state-fact'),
    (r'text-amber-500', 'text-state-hypothesis'),
    (r'text-amber-400', 'text-state-hypothesis'),
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
                
            original = content
            for old, new in replacements:
                content = re.sub(old, new, content)
                
            if content != original:
                with open(path, 'w') as f:
                    f.write(content)
                print(f"Updated {file}")


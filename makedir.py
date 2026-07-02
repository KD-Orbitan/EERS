from pathlib import Path
import pathspec

root = Path(".")

with open(root / ".gitignore") as f:
    spec = pathspec.PathSpec.from_lines(
        pathspec.patterns.GitWildMatchPattern, f
    )

def walk(path, prefix=""):
    entries = []

    for p in sorted(path.iterdir()):
        rel = p.relative_to(root).as_posix()

        if spec.match_file(rel):
            continue

        if p.is_dir():
            entries.append(p)

    for i, d in enumerate(entries):
        last = i == len(entries) - 1
        print(prefix + ("└── " if last else "├── ") + d.name)
        walk(d, prefix + ("    " if last else "│   "))

print(root.name)
walk(root)
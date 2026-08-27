import json

state_path = "project-state.json"

# Load the current state
with open(state_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# 1. Update tasks tracker status
data["current_task"] = "Completed velocity-acceleration-calculator integration"
data["active_task_tracker"] = "Completed velocity-acceleration-calculator integration"

# 2. Increment completedTasksCount
data["completedTasksCount"] = data.get("completedTasksCount", 0) + 1

# 3. Add to completed_tasks
new_task = (
    "Integrate Velocity, Acceleration & Stopping Distance Calculator: verified "
    "lucide-react dependencies, fixed LaTeX curly brace parsing and syntax errors in "
    "components/tools/VelocityAccelerationCalculator.tsx, created static route page "
    "app/tools/math-tools/velocity-acceleration-calculator/page.tsx, configured page "
    "SEO metadata, added category grid listing in app/tools/math-tools/page.tsx, registered "
    "in lib/tools-registry.json, updated public/llms.txt, incremented completedTasksCount, "
    "and updated project-state.json."
)
data["completed_tasks"].insert(0, new_task)

# 4. Add to tools_completed list and update total
new_tool_entry = {
    "name": "Velocity, Acceleration & Stopping Distance Calculator",
    "slug": "velocity-acceleration-calculator",
    "category": "math-tools",
    "component": "components/tools/VelocityAccelerationCalculator.tsx",
    "url": "/tools/math-tools/velocity-acceleration-calculator",
    "version": "1.0 - Production Release",
    "completed_date": "2026-08-26"
}
if "tools_completed" not in data:
    data["tools_completed"] = {"total": 0, "list": []}
data["tools_completed"]["list"].insert(0, new_tool_entry)
data["tools_completed"]["total"] = len(data["tools_completed"]["list"])

# Save the updated state
with open(state_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Updated project-state.json successfully!")

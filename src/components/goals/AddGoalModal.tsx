import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useGoals } from "@/contexts/GoalContext";

const GOAL_PRESETS = [
  { icon: "🏖️", label: "Vacation", color: "#3b82f6" },
  { icon: "💻", label: "Gadget", color: "#8b5cf6" },
  { icon: "🏠", label: "Home", color: "#10b981" },
  { icon: "🚗", label: "Vehicle", color: "#f59e0b" },
  { icon: "🎓", label: "Education", color: "#ec4899" },
  { icon: "🏥", label: "Emergency Fund", color: "#ef4444" },
  { icon: "💍", label: "Wedding", color: "#f97316" },
  { icon: "🎯", label: "Other", color: "#6366f1" },
];

export function AddGoalModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(GOAL_PRESETS[0]);
  const { addGoal } = useGoals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    addGoal({
      title,
      targetAmount: parseFloat(targetAmount),
      deadline: deadline || undefined,
      category: selectedPreset.label,
      color: selectedPreset.color,
      icon: selectedPreset.icon,
    });

    setTitle("");
    setTargetAmount("");
    setDeadline("");
    setSelectedPreset(GOAL_PRESETS[0]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Create Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Savings Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Goal Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    selectedPreset.label === preset.label
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{preset.icon}</span>
                  <span className="text-xs">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Goal Name</Label>
            <Input
              id="title"
              placeholder="e.g., Summer Vacation to Bali"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target Amount</Label>
            <Input
              id="targetAmount"
              type="number"
              placeholder="10000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full">
            Create Goal
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

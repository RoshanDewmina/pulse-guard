'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';

export interface SyntheticStep {
  id?: string;
  order: number;
  type: 'NAVIGATE' | 'CLICK' | 'FILL' | 'SELECT' | 'WAIT' | 'SCREENSHOT' | 'ASSERTION' | 'CUSTOM_SCRIPT';
  label: string;
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
  screenshot?: boolean;
  optional?: boolean;
}

interface StepBuilderProps {
  steps: SyntheticStep[];
  onChange: (steps: SyntheticStep[]) => void;
}

export function StepBuilder({ steps, onChange }: StepBuilderProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const addStep = () => {
    const newStep: SyntheticStep = {
      order: steps.length,
      type: 'NAVIGATE',
      label: `Step ${steps.length + 1}`,
      timeout: 5000,
      screenshot: false,
      optional: false,
    };
    onChange([...steps, newStep]);
    setExpandedStep(steps.length);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder remaining steps
    newSteps.forEach((step, i) => {
      step.order = i;
    });
    onChange(newSteps);
    if (expandedStep === index) {
      setExpandedStep(null);
    }
  };

  const updateStep = (index: number, updates: Partial<SyntheticStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    onChange(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newSteps = [...steps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      newSteps.forEach((step, i) => {
        step.order = i;
      });
      onChange(newSteps);
      setExpandedStep(index - 1);
    } else if (direction === 'down' && index < steps.length - 1) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      newSteps.forEach((step, i) => {
        step.order = i;
      });
      onChange(newSteps);
      setExpandedStep(index + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Test Steps</h3>
          <p className="text-sm text-muted-foreground">
            Define the actions to perform in your synthetic test
          </p>
        </div>
        <Button onClick={addStep} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>

      {steps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No steps yet. Click "Add Step" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <Card key={index}>
              <CardHeader className="p-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                    >
                      ▲
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                    >
                      ▼
                    </Button>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {index + 1}.
                  </span>
                  <CardTitle className="text-base flex-1">{step.label}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                  >
                    {expandedStep === index ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <CardDescription>{step.type}</CardDescription>
              </CardHeader>

              {expandedStep === index && (
                <CardContent className="p-4 pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Step Type</Label>
                      <Select
                        value={step.type}
                        onValueChange={(value) =>
                          updateStep(index, { type: value as SyntheticStep['type'] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NAVIGATE">Navigate</SelectItem>
                          <SelectItem value="CLICK">Click</SelectItem>
                          <SelectItem value="FILL">Fill Input</SelectItem>
                          <SelectItem value="SELECT">Select Option</SelectItem>
                          <SelectItem value="WAIT">Wait</SelectItem>
                          <SelectItem value="SCREENSHOT">Screenshot</SelectItem>
                          <SelectItem value="ASSERTION">Assertion</SelectItem>
                          <SelectItem value="CUSTOM_SCRIPT">Custom Script</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Label</Label>
                      <Input
                        value={step.label}
                        onChange={(e) => updateStep(index, { label: e.target.value })}
                        placeholder="Step description"
                      />
                    </div>
                  </div>

                  {['NAVIGATE'].includes(step.type) && (
                    <div>
                      <Label>URL</Label>
                      <Input
                        value={step.url || ''}
                        onChange={(e) => updateStep(index, { url: e.target.value })}
                        placeholder="https://example.com/page"
                      />
                    </div>
                  )}

                  {['CLICK', 'FILL', 'SELECT', 'WAIT', 'ASSERTION'].includes(step.type) && (
                    <div>
                      <Label>CSS Selector</Label>
                      <Input
                        value={step.selector || ''}
                        onChange={(e) => updateStep(index, { selector: e.target.value })}
                        placeholder="#element-id or .class-name"
                      />
                    </div>
                  )}

                  {['FILL', 'SELECT', 'WAIT', 'ASSERTION', 'CUSTOM_SCRIPT'].includes(step.type) && (
                    <div>
                      <Label>
                        {step.type === 'WAIT' && !step.selector
                          ? 'Wait Time (ms)'
                          : step.type === 'CUSTOM_SCRIPT'
                          ? 'JavaScript Code'
                          : 'Value'}
                      </Label>
                      {step.type === 'CUSTOM_SCRIPT' ? (
                        <textarea
                          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                          value={step.value || ''}
                          onChange={(e) => updateStep(index, { value: e.target.value })}
                          placeholder="console.log('Hello');"
                        />
                      ) : (
                        <Input
                          value={step.value || ''}
                          onChange={(e) => updateStep(index, { value: e.target.value })}
                          placeholder={
                            step.type === 'WAIT' ? '5000' : 'Value to fill or select'
                          }
                        />
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Timeout (ms)</Label>
                      <Input
                        type="number"
                        value={step.timeout || 5000}
                        onChange={(e) =>
                          updateStep(index, { timeout: parseInt(e.target.value) })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id={`screenshot-${index}`}
                        checked={step.screenshot}
                        onCheckedChange={(checked) =>
                          updateStep(index, { screenshot: checked === true })
                        }
                      />
                      <Label htmlFor={`screenshot-${index}`}>Screenshot</Label>
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id={`optional-${index}`}
                        checked={step.optional}
                        onCheckedChange={(checked) =>
                          updateStep(index, { optional: checked === true })
                        }
                      />
                      <Label htmlFor={`optional-${index}`}>Optional</Label>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


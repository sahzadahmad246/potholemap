// components/PotholeDetailsForm.tsx
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, CheckCircle, AlertTriangle, Info } from "lucide-react"

interface PotholeDetailsFormProps {
  formData: {
    title: string;
    description: string;
    criticality: "low" | "medium" | "high";
    dimensions: { length: string; width: string; depth: string };
    taggedOfficials: { role: string; name: string; twitterHandle: string }[];
  };
  onFormDetailsChange: (newDetails: Partial<PotholeDetailsFormProps['formData']>) => void;
}

export default function PotholeDetailsForm({ formData, onFormDetailsChange }: PotholeDetailsFormProps) {

  // Handle tagged officials change
  const handleTaggedOfficialChange = (index: number, field: string, value: string) => {
    const newOfficials = [...formData.taggedOfficials]
    newOfficials[index] = { ...newOfficials[index], [field]: value }
    onFormDetailsChange({ taggedOfficials: newOfficials })
  }

  // Add new tagged official
  const addTaggedOfficial = () => {
    onFormDetailsChange({
      taggedOfficials: [...formData.taggedOfficials, { role: "", name: "", twitterHandle: "" }],
    })
  }

  // Remove tagged official
  const removeTaggedOfficial = (index: number) => {
    if (formData.taggedOfficials.length > 1) {
      const newOfficials = formData.taggedOfficials.filter((_, i) => i !== index)
      onFormDetailsChange({ taggedOfficials: newOfficials })
    }
  }

  // Get criticality color and icon
  const getCriticalityInfo = (criticality: string) => {
    switch (criticality) {
      case "high":
        return {
          color: "destructive",
          icon: AlertTriangle,
          text: "High Priority",
        }
      case "medium":
        return { color: "default", icon: Info, text: "Medium Priority" }
      case "low":
        return { color: "secondary", icon: CheckCircle, text: "Low Priority" }
      default:
        return { color: "default", icon: Info, text: "Medium Priority" }
    }
  }

  const criticalityInfo = getCriticalityInfo(formData.criticality)

  return (
    <>
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onFormDetailsChange({ title: e.target.value })}
            placeholder="Brief description of the pothole"
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onFormDetailsChange({ description: e.target.value })}
            placeholder="Detailed description of the pothole and its impact"
            required
            rows={3}
          />
        </div>
      </div>

      {/* Criticality and Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="criticality">Priority Level</Label>
          <Select
            value={formData.criticality}
            onValueChange={(value: "low" | "medium" | "high") => onFormDetailsChange({ criticality: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Low Priority
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Medium Priority
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  High Priority
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Badge
            variant={criticalityInfo.color as "default" | "secondary" | "destructive" | "outline"}
            className="mt-2"
          >
            <criticalityInfo.icon className="h-3 w-3 mr-1" />
            {criticalityInfo.text}
          </Badge>
        </div>
        {/* Comment field removed as requested */}
      </div>

      {/* Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dimensions (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="length">Length (m)</Label>
              <Input
                id="length"
                type="number"
                value={formData.dimensions.length}
                onChange={(e) =>
                  onFormDetailsChange({
                    dimensions: {
                      ...formData.dimensions,
                      length: e.target.value,
                    },
                  })
                }
                placeholder="0.0"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="width">Width (m)</Label>
              <Input
                id="width"
                type="number"
                value={formData.dimensions.width}
                onChange={(e) =>
                  onFormDetailsChange({
                    dimensions: {
                      ...formData.dimensions,
                      width: e.target.value,
                    },
                  })
                }
                placeholder="0.0"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="depth">Depth (m)</Label>
              <Input
                id="depth"
                type="number"
                value={formData.dimensions.depth}
                onChange={(e) =>
                  onFormDetailsChange({
                    dimensions: {
                      ...formData.dimensions,
                      depth: e.target.value,
                    },
                  })
                }
                placeholder="0.0"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

     

      {/* Tagged Officials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Tagged Officials
            <Button
              type="button"
              onClick={addTaggedOfficial}
              size="sm"
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Plus className="h-4 w-4" />
              Add Official
            </Button>
        </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.taggedOfficials.map((official, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor={`role-${index}`}>Role</Label>
                <Select
                  value={official.role}
                  onValueChange={(value) => handleTaggedOfficialChange(index, "role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                    <SelectItem value="corporator">Corporator</SelectItem>
                    <SelectItem value="mla">MLA</SelectItem>
                    <SelectItem value="mp">MP</SelectItem>
                    <SelectItem value="pradhan">Pradhan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`name-${index}`}>Name</Label>
                <Input
                  id={`name-${index}`}
                  value={official.name}
                  onChange={(e) => handleTaggedOfficialChange(index, "name", e.target.value)}
                  placeholder="Official Name"
                />
              </div>
              <div>
                <Label htmlFor={`twitter-${index}`}>Twitter Handle</Label>
                <Input
                  id={`twitter-${index}`}
                  value={official.twitterHandle}
                  onChange={(e) => handleTaggedOfficialChange(index, "twitterHandle", e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div className="flex items-end">
                {formData.taggedOfficials.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeTaggedOfficial(index)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
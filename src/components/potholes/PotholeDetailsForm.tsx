"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, CheckCircle, AlertTriangle, Info, FileText } from "lucide-react"

interface PotholeDetailsFormProps {
  formData: {
    title: string
    description: string
    criticality: "low" | "medium" | "high"
    dimensions: { length: string; width: string; depth: string }
    taggedOfficials: { role: string; name: string; twitterHandle: string }[]
  }
  onFormDetailsChange: (newDetails: Partial<PotholeDetailsFormProps["formData"]>) => void
}

export default function PotholeDetailsForm({ formData, onFormDetailsChange }: PotholeDetailsFormProps) {
  const handleTaggedOfficialChange = (index: number, field: string, value: string) => {
    const newOfficials = [...formData.taggedOfficials]
    newOfficials[index] = { ...newOfficials[index], [field]: value }
    onFormDetailsChange({ taggedOfficials: newOfficials })
  }

  const addTaggedOfficial = () => {
    onFormDetailsChange({
      taggedOfficials: [...formData.taggedOfficials, { role: "", name: "", twitterHandle: "" }],
    })
  }

  const removeTaggedOfficial = (index: number) => {
    if (formData.taggedOfficials.length > 1) {
      const newOfficials = formData.taggedOfficials.filter((_, i) => i !== index)
      onFormDetailsChange({ taggedOfficials: newOfficials })
    }
  }

  const getCriticalityInfo = (criticality: string) => {
    switch (criticality) {
      case "high":
        return {
          icon: AlertTriangle,
          text: "High Priority",
          description: "Safety hazard - immediate attention needed",
        }
      case "medium":
        return {
          icon: Info,
          text: "Medium Priority",
          description: "Moderate impact on traffic flow",
        }
      case "low":
        return {
          icon: CheckCircle,
          text: "Low Priority",
          description: "Minor inconvenience",
        }
      default:
        return {
          icon: Info,
          text: "Medium Priority",
          description: "Moderate impact on traffic flow",
        }
    }
  }

  const criticalityInfo = getCriticalityInfo(formData.criticality)

  return (
    <Card className="border border-gray-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-black">
          <FileText className="h-5 w-5" />
          Pothole Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-black border-b border-gray-200 pb-2">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-black font-medium">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => onFormDetailsChange({ title: e.target.value })}
                placeholder="Brief description (e.g., 'Large pothole on Main Street')"
                required
                className="border border-gray-300 focus:border-black mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-black font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onFormDetailsChange({ description: e.target.value })}
                placeholder="Detailed description of the pothole, its impact on traffic, and any safety concerns"
                required
                rows={4}
                className="border border-gray-300 focus:border-black mt-1 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Priority Level */}
        <div className="space-y-4">
          <h3 className="font-medium text-black border-b border-gray-200 pb-2">Priority Level</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="criticality" className="text-black font-medium">
                How urgent is this pothole?
              </Label>
              <Select
                value={formData.criticality}
                onValueChange={(value: "low" | "medium" | "high") => onFormDetailsChange({ criticality: value })}
              >
                <SelectTrigger className="border border-gray-300 focus:border-black mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Low Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <span>Medium Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>High Priority</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
              <criticalityInfo.icon className="h-5 w-5 flex-shrink-0" />
              <div>
                <div className="font-medium text-black">{criticalityInfo.text}</div>
                <div className="text-sm text-gray-600">{criticalityInfo.description}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-4">
          <h3 className="font-medium text-black border-b border-gray-200 pb-2">
            Dimensions <span className="text-sm text-gray-500 font-normal">(Optional)</span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="length" className="text-black font-medium text-sm">
                Length (m)
              </Label>
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
                step="0.1"
                min="0"
                className="border border-gray-300 focus:border-black mt-1"
              />
            </div>
            <div>
              <Label htmlFor="width" className="text-black font-medium text-sm">
                Width (m)
              </Label>
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
                step="0.1"
                min="0"
                className="border border-gray-300 focus:border-black mt-1"
              />
            </div>
            <div>
              <Label htmlFor="depth" className="text-black font-medium text-sm">
                Depth (m)
              </Label>
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
                step="0.1"
                min="0"
                className="border border-gray-300 focus:border-black mt-1"
              />
            </div>
          </div>
          <p className="text-sm text-gray-600">Approximate measurements help authorities assess repair needs.</p>
        </div>

        {/* Tagged Officials */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-black border-b border-gray-200 pb-2 flex-1">Tagged Officials</h3>
            <Button
              type="button"
              onClick={addTaggedOfficial}
              size="sm"
              variant="outline"
              className="border border-gray-300 hover:border-black hover:bg-black hover:text-white ml-4 bg-transparent"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Tag relevant officials to ensure your report reaches the right authorities.
          </p>
          <div className="space-y-3">
            {formData.taggedOfficials.map((official, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`role-${index}`} className="text-black font-medium text-sm">
                      Role
                    </Label>
                    <Select
                      value={official.role}
                      onValueChange={(value) => handleTaggedOfficialChange(index, "role", value)}
                    >
                      <SelectTrigger className="border border-gray-300 focus:border-black mt-1">
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
                    <Label htmlFor={`name-${index}`} className="text-black font-medium text-sm">
                      Name
                    </Label>
                    <Input
                      id={`name-${index}`}
                      value={official.name}
                      onChange={(e) => handleTaggedOfficialChange(index, "name", e.target.value)}
                      placeholder="Official Name"
                      className="border border-gray-300 focus:border-black mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`twitter-${index}`} className="text-black font-medium text-sm">
                      Twitter Handle
                    </Label>
                    <Input
                      id={`twitter-${index}`}
                      value={official.twitterHandle}
                      onChange={(e) => handleTaggedOfficialChange(index, "twitterHandle", e.target.value)}
                      placeholder="@username"
                      className="border border-gray-300 focus:border-black mt-1"
                    />
                  </div>
                </div>
                {formData.taggedOfficials.length > 1 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => removeTaggedOfficial(index)}
                      size="sm"
                      variant="outline"
                      className="border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

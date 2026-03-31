import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateChallenge } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ACTIVITY_TYPES, formatActivityName, getUnitForActivity, getDefaultTarget } from "@/lib/constants";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  activityType: z.enum(ACTIVITY_TYPES),
  targetValue: z.coerce.number().min(1, "Must be at least 1"),
  durationDays: z.coerce.number().min(1, "Must be at least 1").max(365),
  startDate: z.date().optional(),
});

export default function ChallengeNew() {
  const [, setLocation] = useLocation();
  const createChallenge = useCreateChallenge();
  const [randomizeReps, setRandomizeReps] = useState(false);
  const [restDayEnabled, setRestDayEnabled] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      activityType: "pushups",
      targetValue: getDefaultTarget("pushups"),
      durationDays: 30,
    }
  });

  const activityType = form.watch("activityType");
  const targetValue = form.watch("targetValue");
  const durationDays = form.watch("durationDays");
  const unit = getUnitForActivity(activityType);

  const restDayCount = restDayEnabled ? Math.floor((durationDays || 0) / 7) : 0;
  const activeDays = (durationDays || 0) - restDayCount;
  const totalTarget = (targetValue || 0) * activeDays;

  const showCustomize = (durationDays || 0) >= 10;

  const handleActivityChange = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    form.setValue("targetValue", getDefaultTarget(value));
  };

  const onSubmit = (data: z.infer<typeof schema>) => {
    createChallenge.mutate({
      data: {
        title: data.title,
        activityType: data.activityType,
        type: "daily",
        targetValue: data.targetValue,
        durationDays: data.durationDays,
        startDate: data.startDate ? data.startDate.toISOString().split('T')[0] : undefined,
        randomizeReps: randomizeReps || undefined,
        restDayEnabled: restDayEnabled || undefined,
      }
    }, {
      onSuccess: (challenge) => {
        toast.success("Challenge created!");
        setLocation(`/challenge/${challenge.slug}`);
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto w-full px-6 md:px-8 py-10">
         <h1 className="text-4xl font-black tracking-tight mb-8">Create a challenge</h1>
         
         <div className="bg-card p-6 md:p-10 rounded-[2rem] border shadow-sm">
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold">Challenge title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Summer Shred, 10k Steps" className="h-14 text-lg rounded-xl border-2 font-medium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="activityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold">Activity</FormLabel>
                      <Select onValueChange={(v) => handleActivityChange(v, field.onChange)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-xl border-2 font-bold text-lg">
                            <SelectValue placeholder="Select activity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl max-h-60 overflow-y-auto">
                          {ACTIVITY_TYPES.map(a => (
                            <SelectItem key={a} value={a} className="font-medium text-base">{formatActivityName(a)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold">Target per day ({unit})</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-14 rounded-xl border-2 font-bold text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="durationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold">Duration (days)</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-14 rounded-xl border-2 font-bold text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {totalTarget > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                    <span className="text-lg font-black text-primary">{totalTarget.toLocaleString()} {unit}</span>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {restDayEnabled
                        ? ` over ${activeDays} active days (${restDayCount} rest)`
                        : ` over ${durationDays} days`}
                    </span>
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-base font-bold">Start date (optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "h-14 rounded-xl border-2 w-full pl-4 text-left font-bold text-lg",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Starts today</span>
                              )}
                              <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                            initialFocus
                            className="rounded-xl"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showCustomize && (
                  <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen}>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center justify-between w-full text-left py-3 px-4 rounded-xl border-2 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-base font-bold">Customize</span>
                        <ChevronDown className={cn("h-5 w-5 transition-transform", customizeOpen && "rotate-180")} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <Checkbox
                          checked={randomizeReps}
                          onCheckedChange={(checked) => setRandomizeReps(checked === true)}
                          className="mt-0.5"
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold">Randomize reps</span>
                          <span className="text-xs text-muted-foreground">Randomizing reps makes it more challenging and prevents plateauing</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <Checkbox
                          checked={restDayEnabled}
                          onCheckedChange={(checked) => setRestDayEnabled(checked === true)}
                          className="mt-0.5"
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold">Rest day</span>
                          <span className="text-xs text-muted-foreground">Each 7th day of the challenge is a rest day</span>
                        </div>
                      </label>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                
                <Button type="submit" size="lg" className="w-full h-16 text-xl font-black rounded-2xl mt-6 shadow-lg" disabled={createChallenge.isPending}>
                  {createChallenge.isPending ? "Creating..." : "Create Challenge"}
                </Button>
             </form>
           </Form>
         </div>
      </div>
    </Layout>
  )
}

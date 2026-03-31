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
import { ACTIVITY_TYPES, formatActivityName, getUnitForActivity, getDefaultTarget } from "@/lib/constants";
import { CalendarIcon } from "lucide-react";
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
  const unit = getUnitForActivity(activityType);

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
         <h1 className="text-4xl font-black tracking-tight mb-8">Create Challenge</h1>
         
         <div className="bg-card p-6 md:p-10 rounded-[2rem] border shadow-sm">
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold">Challenge Title</FormLabel>
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
                
                <div className="grid grid-cols-2 gap-6">
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
                </div>
                
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-base font-bold">Start Date (Optional)</FormLabel>
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
                                <span>Starts Today</span>
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

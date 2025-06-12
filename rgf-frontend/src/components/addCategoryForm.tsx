import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormLabel,
    FormItem,
    FormMessage,
    FormField,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpIcon } from "./HelpIcon";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addCategory, fetchCategories } from "../api/categories";
import { logUserAction, useCurrentUser } from "@/utils/loggingUtils";

// for normalizing data
import { isDuplicateCategory } from "@/utils/duplicateChecks";

const formSchema = z.object({
    Category: z.string().min(2, { message: "Category must have at least 2 characters" }).max(50),
});

export function AddCategoryForm() {
    const [categories, setCategories] = useState<any[]>([]);
    const [statusMessage, setStatusMessage] = useState<null | { type: "success" | "error"; text: string }>(null);
    const currentUser = useCurrentUser();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            Category: "",
        },
    });

    // Fetch existing categories on load
    useEffect(() => {
        const getCategories = async () => {
            try {
                const data = await fetchCategories();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        getCategories();
    }, []);

    // Auto-dismiss messages after 2 seconds
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => setStatusMessage(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        // checks for a duplicate and normalizes the entry
        const normalizedCategory = isDuplicateCategory(data.Category, categories);

        if (!normalizedCategory) {
            setStatusMessage({ type: "error", text: "Category already exists." });
            return;
        }
    
        try {
            const newCategory = await addCategory(normalizedCategory);
            console.log("Category added:", newCategory);
            form.reset();
            setStatusMessage({ type: "success", text: "Category added successfully!" });
    
            // Update local category list with the newly added one
            setCategories((prev) => [...prev, { categoryName: normalizedCategory }]);
            
            // Log the change
            try {
                await logUserAction(
                    "Add Category",
                    `Added new category "${normalizedCategory}"`,
                    currentUser
                );
            } catch (logError) {
                console.error("Error logging change:", logError);
                // Don't throw the error to avoid disrupting the main flow
            }
        } catch (error) {
            console.error("Failed to add category:", error);
            setStatusMessage({ type: "error", text: "Failed to add category." });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <CardTitle>Add Category</CardTitle>
                <HelpIcon 
                    tooltipText="Categories are the highest level of classification, subcategories are below them. Click to learn more!"
                    helpPath="/helpEditingTables"
                    size="md"
                />
            </CardHeader>
            <CardContent>
                {statusMessage && (
                    <div
                        className={`text-center text-sm font-medium p-2 rounded ${
                            statusMessage.type === "success"
                                ? "text-green-600 bg-green-100"
                                : "text-red-600 bg-red-100"
                        }`}
                    >
                        {statusMessage.text}
                    </div>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="Category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name of Category</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Produce" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="bg-green-500 hover:bg-green-700 text-white w-full">
                            Add Category
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

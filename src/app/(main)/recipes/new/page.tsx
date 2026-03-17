import { RecipeForm } from "@/components/recipes/recipe-form";

export const metadata = { title: "New Recipe - Recipe Catalogue" };

export default function NewRecipePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">New Recipe</h1>
      <RecipeForm />
    </div>
  );
}

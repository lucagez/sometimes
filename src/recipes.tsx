import * as React from "react";
import Select from "https://esm.sh/react-select@5.4.0?external=react";
import { withServerState } from "../lib/server.tsx";

type Recipe = {
  id: string;
  title: string;
  link: string;
  img: string;
  description: string;
  rate: string;
  difficulty: string;
  time: string;
  ingredients: Array<{
    ingredient: string;
    quantity: string;
  }>;
};

const recipes: Array<Recipe> = [];

if ("Deno" in window) {
  const decoder = new TextDecoder("utf-8");
  recipes.push(
    ...JSON.parse(
      decoder.decode(await Deno.readFile("./src/data.json")),
    ) as Recipe[],
  );
}

// deno-lint-ignore require-await
const loader = withServerState(import.meta.url, async (req: Request) => {
  const url = new URL(req.url);
  const ingredientQuery = url.searchParams.get("ingredient") || "";
  const selectedRecipes = recipes
    // TODO: filter for duplicates inside data.json
    .filter((x) => {
      if (ingredientQuery === "") return true;

      const queries = ingredientQuery.split(",");
      const occurrences = Array(queries.length).fill(false);

      for (const { ingredient } of x.ingredients) {
        for (const query of queries) {
          if (ingredient.toLowerCase() === query.toLowerCase()) {
            const index = queries.findIndex((x) =>
              x.toLowerCase() === ingredient.toLowerCase()
            );
            occurrences[index] = true;
          }
        }
      }

      return occurrences.filter(Boolean).length === occurrences.length;
    });

  const availableIngredients = new Set<string>();
  for (const recipe of selectedRecipes) {
    for (const { ingredient } of recipe.ingredients) {
      availableIngredients.add(ingredient);
    }
  }

  return {
    number: selectedRecipes.length,
    ingredients: Array.from(availableIngredients).sort(),
    recipes: selectedRecipes.length > 100
      ? selectedRecipes.splice(0, 100)
      : selectedRecipes,
  };
});

const Blog = loader(({ children, data, result, errors, invalidate }) => {
  return (
    <main className="p-4">
      <h1 className="text-3xl font-medium">
        Recipes 🍱
      </h1>
      <i>
        There are <b>{data.number}</b> recipes matching these ingredients
      </i>
      <div className="py-4">
        <Select
          instanceId={"lmao"}
          inputId={"lmao"}
          onChange={(choice) => {
            const params = new URLSearchParams({
              ingredient: Array.from(choice.values()).map(({ value }) => value)
                .join(","),
            });
            invalidate(params);
          }}
          isMulti
          name="ingredients"
          options={data.ingredients.map((x) => ({ value: x, label: x }))}
        />
      </div>
      <ul role="list" className={`divide-y divide-gray-200`}>
        {data.recipes.map((recipe, id) => (
          // TODO: Open native app
          <a href={recipe.link} key={id}>
            <li className={`flex py-4`}>
              <img className={`h-24 w-24 rounded-md`} src={recipe.img} alt="" />
              <div className={`ml-3 cursor-pointer`}>
                <p className={`text-sm font-medium text-gray-900`}>
                  {recipe.title}
                </p>
                <p className={`text-sm text-gray-500`}>{recipe.description}</p>
                <div className="flex space-x-2 pt-2">
                  <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                    ⏱ {recipe.time}
                  </span>
                  <span className="inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                    🍳 {recipe.difficulty}
                  </span>
                </div>
              </div>
            </li>
          </a>
        ))}
      </ul>
    </main>
  );
});

export default Blog;

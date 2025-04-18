// Global Variables
const theMealDBBaseURL = 'https://www.themealdb.com/api/json/v1/1/';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const resultsContainer = document.getElementById('results-container');
const resultsTitle = document.getElementById('results-title');
const recipeModal = document.getElementById('recipe-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');
const loading = document.getElementById('loading');
const noResults = document.getElementById('no-results');
const filterItems = document.querySelectorAll('.filter-item');
const categoryOptions = document.querySelector('.category-options');
const ingredientOptions = document.querySelector('.ingredient-options');
const categoryList = document.getElementById('category-list');
const ingredientList = document.getElementById('ingredient-list');
const ingredientSearchInput = document.getElementById('ingredient-search-input');
const themeToggle = document.querySelector('.theme-toggle');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
closeModal.addEventListener('click', () => recipeModal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === recipeModal) recipeModal.style.display = 'none';
});
themeToggle.addEventListener('click', toggleTheme);
ingredientSearchInput.addEventListener('input', filterIngredients);

filterItems.forEach(item => {
    item.addEventListener('click', () => {
        filterItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const filterType = item.getAttribute('data-filter');
        handleFilterChange(filterType);
    });
});

// Initialize App
async function initApp() {
    // Check for stored theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
    
    // Load popular recipes on initial load
    showLoading();
    try {
        const response = await fetch(`${theMealDBBaseURL}search.php?s=`);
        const data = await response.json();
        displayRecipes(data.meals, 'Popular Recipes');
    } catch (error) {
        console.error('Error loading initial recipes:', error);
        displayNoResults();
    }
    hideLoading();
    
    // Fetch categories and ingredients for filters
    fetchCategories();
    fetchIngredients();
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Handle Filter Changes
function handleFilterChange(filterType) {
    // Hide all filter options first
    categoryOptions.style.display = 'none';
    ingredientOptions.style.display = 'none';
    
    // Show appropriate content based on filter
    switch (filterType) {
        case 'search':
            resultsTitle.textContent = 'Popular Recipes';
            fetchPopularRecipes();
            break;
        case 'category':
            categoryOptions.style.display = 'block';
            break;
        case 'ingredient':
            ingredientOptions.style.display = 'block';
            break;
        case 'random':
            fetchRandomMeal();
            break;
        case 'favorites':
            displayFavorites();
            break;
    }
}

// Search Functionality
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    showLoading();
    try {
        const response = await fetch(`${theMealDBBaseURL}search.php?s=${query}`);
        const data = await response.json();
        
        if (data.meals) {
            displayRecipes(data.meals, `Search Results for "${query}"`);
        } else {
            displayNoResults();
        }
    } catch (error) {
        console.error('Error searching recipes:', error);
        displayNoResults();
    }
    hideLoading();
}

// Fetch Popular Recipes
async function fetchPopularRecipes() {
    showLoading();
    try {
        const response = await fetch(`${theMealDBBaseURL}search.php?s=`);
        const data = await response.json();
        displayRecipes(data.meals, 'Popular Recipes');
    } catch (error) {
        console.error('Error loading popular recipes:', error);
        displayNoResults();
    }
    hideLoading();
}

// Fetch Random Meal
async function fetchRandomMeal() {
    showLoading();
    try {
        const response = await fetch(`${theMealDBBaseURL}random.php`);
        const data = await response.json();
        displayRecipes(data.meals, 'Random Recipe');
    } catch (error) {
        console.error('Error loading random recipe:', error);
        displayNoResults();
    }
    hideLoading();
}

// Display Favorites
function displayFavorites() {
    if (favorites.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-favorites">
                <i class="fas fa-heart-broken"></i>
                <h3>No favorite recipes yet</h3>
                <p>Add recipes to your favorites and they'll appear here</p>
            </div>
        `;
        resultsTitle.textContent = 'Your Favorites';
        return;
    }
    
    showLoading();
    Promise.all(
        favorites.map(mealId => 
            fetch(`${theMealDBBaseURL}lookup.php?i=${mealId}`)
                .then(response => response.json())
        )
    )
    .then(results => {
        const meals = results.map(result => result.meals[0])
            .filter(meal => meal); // Filter out any undefined meals
        
        displayRecipes(meals, 'Your Favorites');
    })
    .catch(error => {
        console.error('Error loading favorites:', error);
        displayNoResults();
    })
    .finally(() => {
        hideLoading();
    });
}

// Fetch Categories
async function fetchCategories() {
    try {
        const response = await fetch(`${theMealDBBaseURL}categories.php`);
        const data = await response.json();
        
        if (data.categories) {
            displayCategories(data.categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        categoryList.innerHTML = '<p>Error loading categories. Please try again later.</p>';
    }
}

// Display Categories
function displayCategories(categories) {
    categoryList.innerHTML = '';
    
    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.classList.add('category-item');
        categoryItem.textContent = category.strCategory;
        categoryItem.addEventListener('click', () => {
            fetchMealsByCategory(category.strCategory);
        });
        
        categoryList.appendChild(categoryItem);
    });
}

// Fetch Meals by Category
async function fetchMealsByCategory(category) {
    showLoading();
    try {
        const response = await fetch(`${theMealDBBaseURL}filter.php?c=${category}`);
        const data = await response.json();
        
        if (data.meals) {
            displayRecipes(data.meals, `${category} Recipes`);
        } else {
            displayNoResults();
        }
    } catch (error) {
        console.error(`Error loading ${category} recipes:`, error);
        displayNoResults();
    }
    hideLoading();
}

// Fetch Ingredients
async function fetchIngredients() {
    try {
        const response = await fetch(`${theMealDBBaseURL}list.php?i=list`);
        const data = await response.json();
        
        if (data.meals) {
            // Only show ingredients that have names (some might be empty)
            const ingredients = data.meals
                .filter(ingredient => ingredient.strIngredient)
                .sort((a, b) => a.strIngredient.localeCompare(b.strIngredient));
            
            displayIngredients(ingredients);
        }
    } catch (error) {
        console.error('Error loading ingredients:', error);
        ingredientList.innerHTML = '<p>Error loading ingredients. Please try again later.</p>';
    }
}

// Display Ingredients
function displayIngredients(ingredients) {
    ingredientList.innerHTML = '';
    
    // Take only the first 30 ingredients to avoid overwhelming the UI
    ingredients.slice(0, 30).forEach(ingredient => {
        const ingredientItem = document.createElement('div');
        ingredientItem.classList.add('ingredient-item');
        ingredientItem.textContent = ingredient.strIngredient;
        ingredientItem.setAttribute('data-ingredient', ingredient.strIngredient.toLowerCase());
        ingredientItem.addEventListener('click', () => {
            fetchMealsByIngredient(ingredient.strIngredient);
        });
        
        ingredientList.appendChild(ingredientItem);
    });
}

// Filter Ingredients
function filterIngredients() {
    const searchTerm = ingredientSearchInput.value.toLowerCase().trim();
    const ingredientItems = ingredientList.querySelectorAll('.ingredient-item');
    
    ingredientItems.forEach(item => {
        const ingredient = item.getAttribute('data-ingredient');
        if (ingredient.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Fetch Meals by Ingredient
async function fetchMealsByIngredient(ingredient) {
    showLoading();
    try {
        const response = await fetch(`${theMealDBBaseURL}filter.php?i=${ingredient}`);
        const data = await response.json();
        
        if (data.meals) {
            displayRecipes(data.meals, `Recipes with ${ingredient}`);
        } else {
            displayNoResults();
        }
    } catch (error) {
        console.error(`Error loading recipes with ${ingredient}:`, error);
        displayNoResults();
    }
    hideLoading();
}

// Display Recipes
function displayRecipes(meals, title) {
    resultsContainer.innerHTML = '';
    resultsTitle.textContent = title;
    
    if (!meals || meals.length === 0) {
        displayNoResults();
        return;
    }
    
    noResults.style.display = 'none';
    
    meals.forEach(meal => {
        const isFavorite = favorites.includes(meal.idMeal);
        
        const recipeCard = document.createElement('div');
        recipeCard.classList.add('recipe-card');
        recipeCard.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-image">
            <div class="recipe-info">
                <h3 class="recipe-title">${meal.strMeal}</h3>
                <p class="recipe-category">${meal.strCategory || 'Various'}</p>
                <p class="recipe-origin">
                    <i class="fas fa-globe"></i> ${meal.strArea || 'International'}
                </p>
                <div class="recipe-buttons">
                    <button class="recipe-btn view-recipe" data-id="${meal.idMeal}">View Recipe</button>
                </div>
            </div>
            <div class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${meal.idMeal}">
                <i class="fas fa-heart"></i>
            </div>
        `;
        
        resultsContainer.appendChild(recipeCard);
        
        // Add event listeners to the buttons in the card
        const viewBtn = recipeCard.querySelector('.view-recipe');
        viewBtn.addEventListener('click', () => {
            openRecipeModal(meal.idMeal);
        });
        
        const favoriteBtn = recipeCard.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', () => {
            toggleFavorite(meal.idMeal, favoriteBtn);
        });
    });
}

// Toggle Favorite
function toggleFavorite(mealId, button) {
    const index = favorites.indexOf(mealId);
    
    if (index === -1) {
        // Add to favorites
        favorites.push(mealId);
        button.classList.add('active');
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        button.classList.remove('active');
        
        // If we're on the favorites page, remove the card
        if (document.querySelector('.filter-item[data-filter="favorites"]').classList.contains('active')) {
            button.closest('.recipe-card').remove();
            
            // If no more favorites, show empty message
            if (favorites.length === 0) {
                displayFavorites();
            }
        }
    }
    
    // Save to localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Open Recipe Modal
async function openRecipeModal(mealId) {
    showLoading();
    try {
        const response = await fetch(`${theMealDBBaseURL}lookup.php?i=${mealId}`);
        const data = await response.json();
        
        if (data.meals && data.meals[0]) {
            displayRecipeDetails(data.meals[0]);
            recipeModal.style.display = 'block';
        } else {
            alert('Error loading recipe details. Please try again.');
        }
    } catch (error) {
        console.error('Error loading recipe details:', error);
        alert('Error loading recipe details. Please try again.');
    }
    hideLoading();
}

// Display Recipe Details
function displayRecipeDetails(meal) {
    const ingredients = [];
    
    // Get all ingredients and their measures
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim() !== '') {
            ingredients.push({
                name: ingredient,
                measure: measure || ''
            });
        }
    }
    
    // Extract YouTube video ID if available
    let videoEmbed = '';
    if (meal.strYoutube) {
        const videoId = meal.strYoutube.split('v=')[1];
        if (videoId) {
            videoEmbed = `
                <div class="recipe-video">
                    <h3 class="recipe-section-title">Video Tutorial</h3>
                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/${videoId}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                </div>
            `;
        }
    }
    
    // Create tags array if available
    let tagsHTML = '';
    if (meal.strTags) {
        const tags = meal.strTags.split(',');
        tagsHTML = tags.map(tag => `<span class="recipe-tag">${tag.trim()}</span>`).join('');
    }
    
    modalBody.innerHTML = `
        <div class="recipe-detail">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-detail-img">
            <h2 class="recipe-detail-title">${meal.strMeal}</h2>
            <div class="recipe-tags">
                ${tagsHTML}
            </div>
            <div class="recipe-meta">
                <div class="recipe-meta-item">
                    <i class="fas fa-utensils"></i>
                    <span>${meal.strCategory || 'Various'}</span>
                </div>
                <div class="recipe-meta-item">
                    <i class="fas fa-globe"></i>
                    <span>${meal.strArea || 'International'}</span>
                </div>
            </div>
            <div class="recipe-ingredients">
                <h3 class="recipe-section-title">Ingredients</h3>
                <div class="ingredients-list">
                    ${ingredients.map(ingredient => `
                        <div class="ingredient-item-detail">
                            <img src="https://www.themealdb.com/images/ingredients/${ingredient.name}-Small.png" alt="${ingredient.name}" class="ingredient-icon">
                            <span class="ingredient-text">${ingredient.measure} ${ingredient.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="recipe-instructions">
                <h3 class="recipe-section-title">Instructions</h3>
                <p class="instructions-text">${formatInstructions(meal.strInstructions)}</p>
            </div>
            ${videoEmbed}
        </div>
    `;
}

// Format Instructions to proper paragraphs
function formatInstructions(instructions) {
    if (!instructions) return '';
    
    // Replace single newlines with spaces
    let formatted = instructions.replace(/(?<!\n)\n(?!\n)/g, ' ');
    
    // Replace double newlines with HTML paragraph breaks
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    
    // Wrap everything in paragraphs
    formatted = `<p>${formatted}</p>`;
    
    return formatted;
}

// Show Loading
function showLoading() {
    loading.style.display = 'block';
}

// Hide Loading
function hideLoading() {
    loading.style.display = 'none';
}

// Display No Results
function displayNoResults() {
    resultsContainer.innerHTML = '';
    noResults.style.display = 'block';
}
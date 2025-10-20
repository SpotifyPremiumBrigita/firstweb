// -----------------------------------------------------------------------------
// CONFIGURACIÓN - ¡Pega tus claves aquí!
// -----------------------------------------------------------------------------
const SUPABASE_URL = 'https://gcujryfbkypghhkibloh.supabase.co'; // Pega la URL aquí
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjdWpyeWZia3lwZ2hoa2libG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5Mjk5OTIsImV4cCI6MjA3NjUwNTk5Mn0.oXXUPYJNcuhuKqLxKJGjZ16RLOnnC_pwi9ofDdxZHxw'; // Pega la clave anónima aquí
const TMDB_API_KEY = '00a8fc81b0f4fdfa360a128cf04d49b6'; // Pega tu clave de TMDb aquí

// -----------------------------------------------------------------------------
// INICIALIZACIÓN DE SUPABASE
// -----------------------------------------------------------------------------
// CORRECTA
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// -----------------------------------------------------------------------------
// REFERENCIAS A ELEMENTOS DEL DOM
// -----------------------------------------------------------------------------
// Películas
const pendingMoviesList = document.getElementById('pending-movies-list');
const watchedMoviesList = document.getElementById('watched-movies-list');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchResults = document.getElementById('searchResults');

// Planes
const planInput = document.getElementById('planInput');
const addPlanButton = document.getElementById('addPlanButton');
const todoPlansList = document.getElementById('todo-plans-list');
const donePlansList = document.getElementById('done-plans-list');

// -----------------------------------------------------------------------------
// LÓGICA DE PELÍCULAS
// -----------------------------------------------------------------------------

// Cargar y mostrar las películas desde Supabase
async function cargarPeliculas() {
    const { data: peliculas, error } = await supabaseClient.from('peliculas_series').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error cargando películas:', error);
        return;
    }

    pendingMoviesList.innerHTML = '';
    watchedMoviesList.innerHTML = '';

    peliculas.forEach(pelicula => {
        const peliculaElement = `
            <div class="bg-slate-700 rounded-lg p-4 flex items-start gap-4">
                <img src="https://image.tmdb.org/t/p/w200${pelicula.poster_path}" alt="${pelicula.title}" class="w-20 rounded">
                <div class="flex-1">
                    <h4 class="font-bold text-lg">${pelicula.title}</h4>
                    <p class="text-sm text-slate-400">${pelicula.overview.substring(0, 100)}...</p>
                    <div class="mt-2">
                        <button onclick="toggleStatusPelicula(${pelicula.id}, '${pelicula.status}')" class="text-xs px-3 py-1 rounded-full ${pelicula.status === 'pendiente' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}">
                            ${pelicula.status === 'pendiente' ? 'Marcar como Vista' : 'Marcar como Pendiente'}
                        </button>
                        <button onclick="eliminarPelicula(${pelicula.id})" class="text-xs px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 ml-2">Eliminar</button>
                    </div>
                </div>
            </div>
        `;
        if (pelicula.status === 'pendiente') {
            pendingMoviesList.innerHTML += peliculaElement;
        } else {
            watchedMoviesList.innerHTML += peliculaElement;
        }
    });
}

// Buscar películas en TMDb
async function buscarPeliculasTMDB() {
    const query = searchInput.value;
    if (!query) return;

    const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`);
    const data = await response.json();

    searchResults.innerHTML = '';
    data.results.slice(0, 5).forEach(item => {
        // Solo mostramos películas o series con póster
        if ((item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path) {
            const resultElement = `
                <div class="flex items-center gap-3 p-2 hover:bg-slate-700 rounded cursor-pointer" onclick='addPelicula(${JSON.stringify(item)})'>
                    <img src="https://image.tmdb.org/t/p/w92${item.poster_path}" class="w-10 rounded">
                    <div>
                        <p class="font-semibold">${item.title || item.name}</p>
                        <p class="text-xs text-slate-400">${item.media_type === 'movie' ? 'Película' : 'Serie'}</p>
                    </div>
                </div>
            `;
            searchResults.innerHTML += resultElement;
        }
    });
}

// Añadir una película a Supabase
async function addPelicula(item) {
    const { error } = await supabaseClient.from('peliculas_series').insert([{
        title: item.title || item.name,
        poster_path: item.poster_path,
        overview: item.overview,
        status: 'pendiente'
    }]);

    if (error) {
        console.error('Error al añadir película:', error);
    } else {
        searchInput.value = '';
        searchResults.innerHTML = '';
        cargarPeliculas();
    }
}

// Cambiar el estado de una película (pendiente/vista)
async function toggleStatusPelicula(id, statusActual) {
    const nuevoStatus = statusActual === 'pendiente' ? 'vista' : 'pendiente';
    await supabaseClient.from('peliculas_series').update({ status: nuevoStatus }).eq('id', id);
    cargarPeliculas();
}

// Eliminar una película
async function eliminarPelicula(id) {
    await supabaseClient.from('peliculas_series').delete().eq('id', id);
    cargarPeliculas();
}

// -----------------------------------------------------------------------------
// LÓGICA DE PLANES
// -----------------------------------------------------------------------------

// Cargar y mostrar los planes
async function cargarPlanes() {
    const { data: planes, error } = await supabaseClient.from('planes').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error cargando planes:', error);
        return;
    }

    todoPlansList.innerHTML = '';
    donePlansList.innerHTML = '';

    planes.forEach(plan => {
        const planElement = `
            <div class="bg-slate-700 rounded-md p-3 flex justify-between items-center">
                <p>${plan.description}</p>
                <div>
                    <button onclick="toggleStatusPlan(${plan.id}, '${plan.status}')" class="text-xs px-3 py-1 rounded-full ${plan.status === 'por_hacer' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}">
                        ${plan.status === 'por_hacer' ? 'Hecho' : 'Pendiente'}
                    </button>
                    <button onclick="eliminarPlan(${plan.id})" class="text-xs px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 ml-2">X</button>
                </div>
            </div>
        `;
        if (plan.status === 'por_hacer') {
            todoPlansList.innerHTML += planElement;
        } else {
            donePlansList.innerHTML += planElement;
        }
    });
}

// Añadir un nuevo plan
async function addPlan() {
    const description = planInput.value;
    if (!description) return;

    const { error } = await supabaseClient.from('planes').insert([{ description: description, status: 'por_hacer' }]);
    if (error) {
        console.error('Error al añadir plan:', error);
    } else {
        planInput.value = '';
        cargarPlanes();
    }
}

// Cambiar estado de un plan
async function toggleStatusPlan(id, statusActual) {
    const nuevoStatus = statusActual === 'por_hacer' ? 'hecho' : 'por_hacer';
    await supabaseClient.from('planes').update({ status: nuevoStatus }).eq('id', id);
    cargarPlanes();
}

// Eliminar un plan
async function eliminarPlan(id) {
    await supabaseClient.from('planes').delete().eq('id', id);
    cargarPlanes();
}

// -----------------------------------------------------------------------------
// EVENT LISTENERS Y CARGA INICIAL
// -----------------------------------------------------------------------------
searchButton.addEventListener('click', buscarPeliculasTMDB);
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') buscarPeliculasTMDB();
});
addPlanButton.addEventListener('click', addPlan);
planInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') addPlan();
});

// Carga inicial de datos al abrir la página
cargarPeliculas();
cargarPlanes();
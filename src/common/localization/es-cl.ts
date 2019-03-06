import { IAppStrings } from "../strings";

/**
 * App Strings for Spanish language
 */
export const spanish: IAppStrings = {
    appName: "Herramienta Visual de Etiquetado de Objetos",
    common: {
        displayName: "Nombre para Mostrar",
        description: "Descripción",
        submit: "Enviar",
        cancel: "Cancelar",
        save: "Guardar",
        delete: "Eliminar",
        provider: "Proveedor",
        homePage: "Página de Inicio",
    },
    homePage: {
        newProject: "Nuevo Proyecto",
        recentProjects: "Proyectos Recientes",
        openLocalProject: {
            title: "Abrir Proyecto Local",
        },
        openCloudProject: {
            title: "Abrir Proyecto de la Nube",
            selectConnection: "Select a Connection",
        },
        deleteProject: {
            title: "Borrar Proyecto",
            confirmation: "¿Está seguro que quiere borrar el proyecto",
        },
        importProject: {
            title: "Importar Proyecto",
            confirmation: "¿Está seguro que quiere convertir el proyecto ${project.file.name}" +
                "a formato v2? Le recomendamos que haga una copia de seguridad de su archivo de proyecto.",
        },
    },
    appSettings: {
        title: "Configuración de Aplicación",
        storageTitle: "Configuración de Almacenamiento",
        uiHelp: "Donde se guardan sus configuraciones",
        save: "Guardar configuración",
        securityToken: {
            name: {
                title: "Nombre",
            },
            key: {
                title: "Clave",
            },
        },
        securityTokens: {
            title: "Tokens de seguridad",
            // tslint:disable-next-line:max-line-length
            description: "Los tokens de seguridad se utilizan para cifrar datos confidenciales dentro de la configuración del proyecto",
        },
        version: {
            description: "Versión:",
        },
        devTools: {
            description: "Abrir herramientas de desarrollo de aplicaciones para ayudar a diagnosticar problemas.",
            button: "Alternar Herramientas de Desarrollo",
        },
        reload: {
            description: "Recargar la aplicación descartando todos los cambios actuales",
            button: "Recargar la aplicación",
        },
        messages: {
            saveSuccess: "Configuración de la aplicación guardada correctamente",
        },
    },
    projectSettings: {
        title: "Configuración de Proyecto",
        securityToken: {
            title: "Token de seguridad",
            description: "Se utiliza para cifrar datos confidenciales dentro de archivos de proyecto",
        },
        save: "Guardar el Proyecto",
        sourceConnection: {
            title: "Conexión de Origen",
            description: "De donde se gargan sus activos",
        },
        targetConnection: {
            title: "Conexión de Destino",
            description: "Donde se guarda su proyecto y sus datos exportados",
        },
        videoSettings: {
            title: "Ajustes de video",
            description: "La velocidad a la que se extraen los marcos para el etiquetado.",
            frameExtractionRate: "Tasa de extracción de cuadros (cuadros por segundo de video)",
        },
        addConnection: "Agregar Conexión",
        messages: {
            saveSuccess: "Guardado correctamente ${project.name} configuración del proyecto",
        },
    },
    projectMetrics: {
        title: "Métricas del Proyecto",
        sourceAssetsCount: "Número de activos de origen",
        visitedAssetsCount: "Número de activos visitados",
        taggedAssetsCount: "Número de activos etiquetados",
        regionsCount: "Número de regiones dibujadas",
        tagCategories: "Número de categorías de etiquetas",
        tagCount: "Totales por etiqueta (número de instancias de esa etiqueta)",
        averageTagPerTaggedAsset: "Etiquetas promedio por activo etiquetado",
    },
    tags: {
        title: "Etiquetas",
        placeholder: "Agregar nuevo etiqueta",
        editor: "Editor de Etiquetas",
        modal: {
            name: "Nombre de Etiqueta",
            color: "Color de Etiqueta",
        },
        colors: {
            white: "Blanco",
            gray: "Gris",
            red: "Rojo",
            maroon: "Granate",
            yellow: "Amarillo",
            olive: "Olivo",
            lime: "Lima",
            green: "Verde",
            aqua: "Aqua",
            teal: "Trullo",
            blue: "Azul",
            navy: "Azul Marino",
            fuschia: "Fuschia",
            purple: "Púrpura",
        },
    },
    connections: {
        title: "Conexiones",
        save: "Guardar Conexión",
        details: "Detalles de Conexión",
        settings: "Configuración de Conexión",
        instructions: "Por favor seleccione una conexión para editar",
        providers: {
            azureBlob: {
                title: "Almacenamiento de Azure Blob",
            },
            bing: {
                title: "Búsqueda de Imágenes Bing",
                options: "Opciones de Búsqueda de Imágenes Bing",
                apiKey: "Clave API",
                query: "Consulta",
                aspectRatio: {
                    title: "Relación de Aspecto",
                    all: "Todos",
                    square: "Cuadrado",
                    wide: "Ancho",
                    tall: "Alto",
                },
            },
            local: {
                title: "Sistema de Archivos Local",
                folderPath: "Ruta de la carpeta",
                selectFolder: "Seleccionar la carpeta",
                chooseFolder: "Elijir la carpeta",
            },
        },
    },
    editorPage: {
        width: "Anchura",
        height: "Altura",
        toolbar: {
            select: "Seleccionar",
            pan: "Pan",
            drawRectangle: "Dibujar Rectángulo",
            drawPolygon: "Dibujar Polígono",
            saveProject: "Guardar Proyecto",
            exportProject: "Exprtar Proyecto",
        },
        videoPlayer: {
            previousTaggedFrame: {
                tooltip: "Fotograma etiquetado anterior",
            },
            nextTaggedFrame: {
                tooltip: "Siguiente marco etiquetado",
            },
            previousExpectedFrame: {
                tooltip: "Fotograma anterior",
            },
            nextExpectedFrame: {
                tooltip: "Siguiente marco",
            },
        },
        assetError: "No se puede mostrar el activo",
    },
    export: {
        title: "Exportar",
        settings: "Configuración de Exportación",
        saveSettings: "Guardar Configuración de Exportación",
        providers: {
            common: {
                properties: {
                    assetState: {
                        title: "Estado del activo",
                        description: "Qué activos incluir en la exportación",
                        options: {
                            all: "Todos los activos",
                            visited: "Solo activos visitados",
                            tagged: "Solo activos etiquetados",
                        },
                    },
                },
            },
            vottJson: {
                displayName: "VoTT JSON",
            },
            azureCV: {
                displayName: "Servicio de Visión Personalizada Azure",
                properties: {
                    apiKey: {
                        title: "Clave de API",
                    },
                    classificationType: {
                        title: "Tipo de clasificación",
                        options: {
                            multiLabel: "Varias etiquetas por imagen",
                            multiClass: "Una sola etiqueta por imagen",
                        },
                    },
                    name: {
                        title: "Nombre del proyecto",
                    },
                    description: {
                        title: "Descripción del proyecto",
                    },
                    domainId: {
                        title: "Dominio",
                    },
                    newOrExisting: {
                        title: "Proyecto nuevo o existente",
                        options: {
                            new: "Nuevo proyecto",
                            existing: "Proyecto existente",
                        },
                    },
                    projectId: {
                        title: "Nombre del proyecto",
                    },
                    projectType: {
                        title: "Tipo de proyecto",
                        options: {
                            classification: "Clasificación",
                            objectDetection: "Detección de objetos",
                        },
                    },
                },
            },
            tfRecords: {
                displayName: "Registros de Tensorflow",
            },
            tfPascalVoc: {
                displayName: "Tensorflow Pascal VOC",
            },
        },
        messages: {
            saveSuccess: "Configuración de exportación guardada correctamente",
        },
    },
    activeLearning: {
        title: "Aprendizaje Activo",
    },
    profile: {
        settings: "Configuración de Perfíl",
    },
    errors: {
        unknown: {
            title: "Error desconocido",
            message: "La aplicación contó un error desconocido.  Por favor inténtalo de nuevo.",
        },
        projectUploadError: {
            title: "Error al cargar el archivo",
            message: `Se ha cargado un error al cargar el archivo.
                Compruebe que el archivo es del tipo correcto e inténtelo de nuevo.`,
        },
        genericRenderError: {
            title: "Error desconocido",
            message: "La aplicación contó un error desconocido.  Por favor inténtalo de nuevo.",
        },
        projectInvalidSecurityToken: {
            title: "Error al cargar el archivo de proyecto",
            message: "Asegúrese de que el token de seguridad del proyecto existe",
        },
        projectInvalidJson: {
            title: "Error al analizar el archivo de proyecto",
            message: "El archivo de proyecto no es válido JSON",
        },
        projectDeleteError: {
            title: "Error al eliminar el proyecto",
            message: `Se ha producido un error al eliminar el proyecto.
                Validar el archivo de proyecto y el token de seguridad existen e inténtelo de nuevo`,
        },
        securityTokenNotFound: {
            title: "Error al cargar el archivo del proyecto",
            message: `El token de seguridad al que hace referencia el proyecto no se encuentra en la
                configuración de la aplicación actual. Compruebe que existe el token de seguridad e intente
                volver a cargar el proyecto.`,
        },
        canvasError: {
            title: "Error al cargar el lienzo",
            message: `Se produjo un error al cargar el lienzo, verifique los activos del
                proyecto y vuelva a intentarlo.`,
        },
        importError: {
            title: "Error al importar el proyecto V1",
            message: "Hubo un error al importar el proyecto V1. Revisa el archivo del proyecto y vuelve a intentarlo",
        },
        pasteRegionTooBigError: {
            title: "Error al pegar region al activo",
            message: "Hubo un error al pagar el region al activo. Intenta copiar otra region",
        },
        exportFormatNotFound: {
            title: "Error exportando proyecto",
            message: `Proyecto falta el formato de exportación. Seleccione un formato de exportación en la página
            de configuración de exportación.`,
        },
    },
};

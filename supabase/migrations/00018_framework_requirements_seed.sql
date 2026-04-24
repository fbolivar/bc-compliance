-- =====================================================
-- BC COMPLIANCE - MIGRATION 00018
-- Seed: framework_domains and framework_requirements
-- Frameworks: iso27001, iso22301, nist_csf, pci_dss, ley_1581, decreto_338
-- =====================================================
-- Idempotent: all inserts use ON CONFLICT DO NOTHING

-- =====================================================
-- ISO 27001:2022 — 4 Annex A domains, 93 controls
-- =====================================================
DO $$
DECLARE
    v_fw_id   UUID;
    v_d_a5    UUID;
    v_d_a6    UUID;
    v_d_a7    UUID;
    v_d_a8    UUID;
BEGIN
    SELECT id INTO v_fw_id FROM frameworks WHERE code = 'iso27001';
    IF v_fw_id IS NULL THEN
        RAISE NOTICE 'Framework iso27001 not found, skipping.';
        RETURN;
    END IF;

    -- ── Domains ──────────────────────────────────────
    INSERT INTO framework_domains (id, framework_id, parent_id, code, name, level, sort_order, created_at)
    VALUES
        (gen_random_uuid(), v_fw_id, NULL, 'A.5', 'Controles Organizacionales',  1, 10, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'A.6', 'Controles de Personas',        1, 20, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'A.7', 'Controles Físicos',            1, 30, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'A.8', 'Controles Tecnológicos',       1, 40, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    SELECT id INTO v_d_a5 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'A.5';
    SELECT id INTO v_d_a6 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'A.6';
    SELECT id INTO v_d_a7 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'A.7';
    SELECT id INTO v_d_a8 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'A.8';

    -- ── A.5 — Controles Organizacionales (37 controles) ──────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_a5, 'A.5.1',  'Políticas de Seguridad de la Información',
         'Se deben definir, aprobar por la dirección, publicar, comunicar y reconocer por el personal relevante y las partes interesadas pertinentes, y revisar a intervalos planificados o cuando se produzcan cambios significativos, las políticas de seguridad de la información.',
         TRUE,  10, now()),
        (v_fw_id, v_d_a5, 'A.5.2',  'Roles y Responsabilidades de Seguridad de la Información',
         'Los roles y responsabilidades de seguridad de la información se deben definir y asignar de acuerdo con las necesidades de la organización.',
         TRUE,  20, now()),
        (v_fw_id, v_d_a5, 'A.5.3',  'Segregación de Deberes',
         'Los deberes y áreas de responsabilidad en conflicto se deben segregar para reducir las oportunidades de modificación no autorizada o no intencionada, o el mal uso de los activos de la organización.',
         TRUE,  30, now()),
        (v_fw_id, v_d_a5, 'A.5.4',  'Responsabilidades de la Dirección',
         'La dirección debe exigir a todo el personal que aplique la seguridad de la información de acuerdo con la política y los procedimientos establecidos de seguridad de la información de la organización.',
         TRUE,  40, now()),
        (v_fw_id, v_d_a5, 'A.5.5',  'Contacto con Autoridades',
         'La organización debe establecer y mantener contacto con las autoridades pertinentes.',
         TRUE,  50, now()),
        (v_fw_id, v_d_a5, 'A.5.6',  'Contacto con Grupos de Interés Especial',
         'La organización debe establecer y mantener contacto con grupos de interés especial u otros foros especializados de seguridad y asociaciones profesionales.',
         TRUE,  60, now()),
        (v_fw_id, v_d_a5, 'A.5.7',  'Inteligencia de Amenazas',
         'La información sobre amenazas a la seguridad de la información se debe recopilar y analizar para producir inteligencia de amenazas.',
         TRUE,  70, now()),
        (v_fw_id, v_d_a5, 'A.5.8',  'Seguridad de la Información en la Gestión de Proyectos',
         'La seguridad de la información se debe integrar en la gestión de proyectos.',
         TRUE,  80, now()),
        (v_fw_id, v_d_a5, 'A.5.9',  'Inventario de Información y Otros Activos Asociados',
         'Se debe desarrollar y mantener un inventario de información y otros activos asociados, incluidos los propietarios.',
         TRUE,  90, now()),
        (v_fw_id, v_d_a5, 'A.5.10', 'Uso Aceptable de la Información y Otros Activos Asociados',
         'Las reglas para el uso aceptable y los procedimientos para el manejo de información y otros activos asociados se deben identificar, documentar e implementar.',
         TRUE, 100, now()),
        (v_fw_id, v_d_a5, 'A.5.11', 'Devolución de Activos',
         'El personal y otras partes interesadas relevantes deben devolver todos los activos de la organización en su posesión al finalizar su empleo, contrato o acuerdo.',
         TRUE, 110, now()),
        (v_fw_id, v_d_a5, 'A.5.12', 'Clasificación de la Información',
         'La información se debe clasificar de acuerdo con las necesidades de seguridad de la información de la organización, basándose en la confidencialidad, integridad, disponibilidad y requisitos de las partes interesadas pertinentes.',
         TRUE, 120, now()),
        (v_fw_id, v_d_a5, 'A.5.13', 'Etiquetado de la Información',
         'Se debe desarrollar e implementar un conjunto apropiado de procedimientos para el etiquetado de la información de acuerdo con el esquema de clasificación de información adoptado por la organización.',
         TRUE, 130, now()),
        (v_fw_id, v_d_a5, 'A.5.14', 'Transferencia de Información',
         'Las reglas, procedimientos o acuerdos de transferencia de información se deben contar para todos los tipos de instalaciones de transferencia dentro de la organización y entre la organización y otras partes.',
         TRUE, 140, now()),
        (v_fw_id, v_d_a5, 'A.5.15', 'Control de Acceso',
         'Se deben establecer e implementar reglas para controlar el acceso físico y lógico a la información y otros activos asociados sobre la base de los requisitos de seguridad de la información y del negocio.',
         TRUE, 150, now()),
        (v_fw_id, v_d_a5, 'A.5.16', 'Gestión de Identidades',
         'Se debe gestionar el ciclo de vida completo de las identidades.',
         TRUE, 160, now()),
        (v_fw_id, v_d_a5, 'A.5.17', 'Información de Autenticación',
         'La asignación y gestión de la información de autenticación se deben controlar mediante un proceso de gestión, incluido el asesoramiento al personal sobre el manejo adecuado de la información de autenticación.',
         TRUE, 170, now()),
        (v_fw_id, v_d_a5, 'A.5.18', 'Derechos de Acceso',
         'Los derechos de acceso a información y otros activos asociados se deben aprovisionar, revisar, modificar y eliminar de acuerdo con la política de control de acceso y las reglas específicas del tema de la organización.',
         TRUE, 180, now()),
        (v_fw_id, v_d_a5, 'A.5.19', 'Seguridad de la Información en las Relaciones con Proveedores',
         'Se deben definir e implementar procesos y procedimientos para gestionar los riesgos de seguridad de la información asociados con el uso de productos o servicios de proveedores.',
         TRUE, 190, now()),
        (v_fw_id, v_d_a5, 'A.5.20', 'Abordar la Seguridad de la Información en los Acuerdos con Proveedores',
         'Los requisitos de seguridad de la información relevantes se deben establecer y acordar con cada proveedor sobre la base del tipo de relación con el proveedor.',
         TRUE, 200, now()),
        (v_fw_id, v_d_a5, 'A.5.21', 'Gestión de la Seguridad de la Información en la Cadena de Suministro de TIC',
         'Se deben definir e implementar procesos y procedimientos para gestionar los riesgos de seguridad de la información asociados con la cadena de suministro de productos y servicios de TIC.',
         TRUE, 210, now()),
        (v_fw_id, v_d_a5, 'A.5.22', 'Seguimiento, Revisión y Gestión de Cambios de los Servicios de Proveedores',
         'La organización debe monitorear, revisar, evaluar y gestionar regularmente el cambio en las prácticas de seguridad de la información del proveedor y la prestación de servicios.',
         TRUE, 220, now()),
        (v_fw_id, v_d_a5, 'A.5.23', 'Seguridad de la Información para el Uso de Servicios en la Nube',
         'Los procesos para la adquisición, uso, gestión y salida de los servicios en la nube se deben establecer de acuerdo con los requisitos de seguridad de la información de la organización.',
         TRUE, 230, now()),
        (v_fw_id, v_d_a5, 'A.5.24', 'Planificación y Preparación de la Gestión de Incidentes de Seguridad de la Información',
         'La organización debe planificar y prepararse para gestionar los incidentes de seguridad de la información definiendo, estableciendo y comunicando los procesos, roles y responsabilidades de gestión de incidentes de seguridad de la información.',
         TRUE, 240, now()),
        (v_fw_id, v_d_a5, 'A.5.25', 'Evaluación y Decisión sobre los Eventos de Seguridad de la Información',
         'La organización debe evaluar los eventos de seguridad de la información y decidir si se deben categorizar como incidentes de seguridad de la información.',
         TRUE, 250, now()),
        (v_fw_id, v_d_a5, 'A.5.26', 'Respuesta a Incidentes de Seguridad de la Información',
         'Los incidentes de seguridad de la información deben responderse de acuerdo con los procedimientos documentados.',
         TRUE, 260, now()),
        (v_fw_id, v_d_a5, 'A.5.27', 'Aprendizaje de los Incidentes de Seguridad de la Información',
         'El conocimiento adquirido de los incidentes de seguridad de la información se debe utilizar para fortalecer y mejorar los controles de seguridad de la información.',
         TRUE, 270, now()),
        (v_fw_id, v_d_a5, 'A.5.28', 'Recopilación de Evidencias',
         'La organización debe establecer e implementar procedimientos para la identificación, recopilación, adquisición y preservación de evidencias relacionadas con eventos de seguridad de la información.',
         TRUE, 280, now()),
        (v_fw_id, v_d_a5, 'A.5.29', 'Seguridad de la Información Durante la Interrupción',
         'La organización debe planificar cómo mantener la seguridad de la información en un nivel apropiado durante la interrupción.',
         TRUE, 290, now()),
        (v_fw_id, v_d_a5, 'A.5.30', 'Preparación de las TIC para la Continuidad del Negocio',
         'La preparación de las TIC se debe planificar, implementar, mantener y probar en función de los objetivos de continuidad del negocio y los requisitos de continuidad de las TIC.',
         TRUE, 300, now()),
        (v_fw_id, v_d_a5, 'A.5.31', 'Requisitos Legales, Estatutarios, Reglamentarios y Contractuales',
         'Los requisitos legales, estatutarios, reglamentarios y contractuales relevantes para la seguridad de la información y el enfoque de la organización para cumplirlos se deben identificar, documentar y mantener actualizados.',
         TRUE, 310, now()),
        (v_fw_id, v_d_a5, 'A.5.32', 'Derechos de Propiedad Intelectual',
         'La organización debe implementar procedimientos apropiados para proteger los derechos de propiedad intelectual.',
         TRUE, 320, now()),
        (v_fw_id, v_d_a5, 'A.5.33', 'Protección de Registros',
         'Los registros se deben proteger contra pérdida, destrucción, falsificación, acceso no autorizado y divulgación no autorizada.',
         TRUE, 330, now()),
        (v_fw_id, v_d_a5, 'A.5.34', 'Privacidad y Protección de la Información de Identificación Personal',
         'La organización debe identificar y cumplir los requisitos relativos a la preservación de la privacidad y la protección de la PII de acuerdo con las leyes y regulaciones aplicables.',
         TRUE, 340, now()),
        (v_fw_id, v_d_a5, 'A.5.35', 'Revisión Independiente de la Seguridad de la Información',
         'El enfoque de la organización para gestionar la seguridad de la información y su implementación, incluyendo personas, procesos y tecnologías, se debe revisar de manera independiente a intervalos planificados o cuando se produzcan cambios significativos.',
         TRUE, 350, now()),
        (v_fw_id, v_d_a5, 'A.5.36', 'Cumplimiento de Políticas, Reglas y Estándares de Seguridad de la Información',
         'El cumplimiento de la política de seguridad de la información de la organización, las políticas, reglas y estándares específicos del tema se deben revisar regularmente.',
         TRUE, 360, now()),
        (v_fw_id, v_d_a5, 'A.5.37', 'Procedimientos de Operación Documentados',
         'Los procedimientos de operación para las instalaciones de procesamiento de información se deben documentar y estar disponibles para el personal que los necesite.',
         TRUE, 370, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── A.6 — Controles de Personas (8 controles) ────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_a6, 'A.6.1', 'Investigación de Antecedentes',
         'Las verificaciones de antecedentes de todos los candidatos a ser personal se deben llevar a cabo antes de unirse a la organización y de forma continua, teniendo en cuenta la legislación, regulaciones y ética aplicables, y en proporción a los requisitos de negocio, la clasificación de la información a la que se va a acceder y los riesgos percibidos.',
         TRUE, 10, now()),
        (v_fw_id, v_d_a6, 'A.6.2', 'Términos y Condiciones de Empleo',
         'Los acuerdos contractuales con el personal deben indicar sus responsabilidades y las de la organización en materia de seguridad de la información.',
         TRUE, 20, now()),
        (v_fw_id, v_d_a6, 'A.6.3', 'Concienciación, Educación y Formación en Seguridad de la Información',
         'El personal de la organización y las partes interesadas pertinentes deben recibir una formación adecuada en concienciación sobre seguridad de la información, educación y formación, y actualizaciones periódicas de la política de seguridad de la información de la organización y procedimientos específicos del tema.',
         TRUE, 30, now()),
        (v_fw_id, v_d_a6, 'A.6.4', 'Proceso Disciplinario',
         'Se debe contar con un proceso disciplinario que se formalice y comunique para tomar medidas contra el personal y otras partes interesadas relevantes que hayan cometido una violación de la política de seguridad de la información.',
         TRUE, 40, now()),
        (v_fw_id, v_d_a6, 'A.6.5', 'Responsabilidades Tras el Cese o Cambio de Empleo',
         'Las responsabilidades y obligaciones de seguridad de la información que permanecen vigentes tras el cese o cambio de empleo se deben definir, hacer cumplir y comunicar al personal relevante y a otras partes interesadas.',
         TRUE, 50, now()),
        (v_fw_id, v_d_a6, 'A.6.6', 'Acuerdos de Confidencialidad o No Divulgación',
         'Los acuerdos de confidencialidad o de no divulgación que reflejen las necesidades de protección de la información de la organización se deben identificar, documentar, revisar regularmente e implementar.',
         TRUE, 60, now()),
        (v_fw_id, v_d_a6, 'A.6.7', 'Trabajo Remoto',
         'Se deben implementar medidas de seguridad cuando el personal trabaja de forma remota para proteger la información a la que se accede, procesa o almacena fuera de las instalaciones de la organización.',
         TRUE, 70, now()),
        (v_fw_id, v_d_a6, 'A.6.8', 'Reporte de Eventos de Seguridad de la Información',
         'La organización debe proporcionar un mecanismo para que el personal pueda reportar los eventos de seguridad de la información observados o sospechosos a través de los canales adecuados de manera oportuna.',
         TRUE, 80, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── A.7 — Controles Físicos (14 controles) ───────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_a7, 'A.7.1',  'Perímetros de Seguridad Física',
         'Se deben definir y usar perímetros de seguridad para proteger las áreas que contienen información y otros activos asociados.',
         TRUE, 10, now()),
        (v_fw_id, v_d_a7, 'A.7.2',  'Entrada Física',
         'Las áreas seguras se deben proteger mediante controles de entrada apropiados y puntos de acceso.',
         TRUE, 20, now()),
        (v_fw_id, v_d_a7, 'A.7.3',  'Seguridad de Oficinas, Despachos e Instalaciones',
         'La seguridad física para oficinas, despachos e instalaciones se debe diseñar e implementar.',
         TRUE, 30, now()),
        (v_fw_id, v_d_a7, 'A.7.4',  'Monitoreo de la Seguridad Física',
         'Las instalaciones deben monitorizarse continuamente para detectar accesos físicos no autorizados.',
         TRUE, 40, now()),
        (v_fw_id, v_d_a7, 'A.7.5',  'Protección contra Amenazas Físicas y Ambientales',
         'Se debe diseñar e implementar protección contra amenazas físicas y ambientales, como desastres naturales y otros accidentes físicos o ataques a la infraestructura.',
         TRUE, 50, now()),
        (v_fw_id, v_d_a7, 'A.7.6',  'Trabajo en Áreas Seguras',
         'Se deben diseñar e implementar medidas de seguridad para trabajar en áreas seguras.',
         TRUE, 60, now()),
        (v_fw_id, v_d_a7, 'A.7.7',  'Escritorio Despejado y Pantalla Limpia',
         'Se deben definir e implementar apropiadamente reglas de escritorio despejado para papeles y medios de almacenamiento extraíbles, y reglas de pantalla limpia para las instalaciones de procesamiento de información.',
         TRUE, 70, now()),
        (v_fw_id, v_d_a7, 'A.7.8',  'Ubicación y Protección de los Equipos',
         'Los equipos se deben ubicar de forma segura y proteger.',
         TRUE, 80, now()),
        (v_fw_id, v_d_a7, 'A.7.9',  'Seguridad de los Activos Fuera de las Instalaciones',
         'Los activos fuera de las instalaciones se deben proteger.',
         TRUE, 90, now()),
        (v_fw_id, v_d_a7, 'A.7.10', 'Medios de Almacenamiento',
         'Los medios de almacenamiento deben gestionarse a lo largo de su ciclo de vida de adquisición, uso, transporte y eliminación de acuerdo con el esquema de clasificación y los requisitos de manejo de la organización.',
         TRUE, 100, now()),
        (v_fw_id, v_d_a7, 'A.7.11', 'Servicios de Suministro',
         'Las instalaciones de procesamiento de información deben protegerse contra fallos de alimentación y otras interrupciones causadas por fallos en los servicios de suministro.',
         TRUE, 110, now()),
        (v_fw_id, v_d_a7, 'A.7.12', 'Seguridad del Cableado',
         'Los cables que transportan electricidad o transmiten datos o que sostienen los servicios de información deben protegerse contra interceptación, interferencia o daño.',
         TRUE, 120, now()),
        (v_fw_id, v_d_a7, 'A.7.13', 'Mantenimiento de los Equipos',
         'Los equipos se deben mantener correctamente para garantizar la disponibilidad, integridad y confidencialidad de la información.',
         TRUE, 130, now()),
        (v_fw_id, v_d_a7, 'A.7.14', 'Eliminación Segura o Reutilización de Equipos',
         'Los elementos de los equipos que contengan medios de almacenamiento se deben verificar para garantizar que se hayan eliminado o sobrescrito de forma segura todos los datos confidenciales y el software con licencia antes de la eliminación o reutilización.',
         TRUE, 140, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── A.8 — Controles Tecnológicos (34 controles) ──────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_a8, 'A.8.1',  'Dispositivos de Usuario Final',
         'La información almacenada en, procesada por o accesible a través de dispositivos de usuario final se debe proteger.',
         TRUE, 10, now()),
        (v_fw_id, v_d_a8, 'A.8.2',  'Derechos de Acceso Privilegiados',
         'La asignación y uso de derechos de acceso privilegiados se debe restringir y gestionar.',
         TRUE, 20, now()),
        (v_fw_id, v_d_a8, 'A.8.3',  'Restricción del Acceso a la Información',
         'El acceso a la información y otros activos asociados se debe restringir de acuerdo con la política de control de acceso establecida.',
         TRUE, 30, now()),
        (v_fw_id, v_d_a8, 'A.8.4',  'Acceso al Código Fuente',
         'El acceso de lectura y escritura al código fuente, herramientas de desarrollo y bibliotecas de software se debe gestionar adecuadamente.',
         TRUE, 40, now()),
        (v_fw_id, v_d_a8, 'A.8.5',  'Autenticación Segura',
         'Se deben implementar tecnologías y procedimientos de autenticación segura basándose en restricciones de acceso a la información y en la política de control de acceso específica del tema.',
         TRUE, 50, now()),
        (v_fw_id, v_d_a8, 'A.8.6',  'Gestión de la Capacidad',
         'El uso de recursos se debe monitorear y ajustar, y se deben hacer proyecciones de los requisitos de capacidad futura para garantizar el rendimiento requerido del sistema.',
         TRUE, 60, now()),
        (v_fw_id, v_d_a8, 'A.8.7',  'Protección contra Malware',
         'La protección contra el malware se debe implementar y está respaldada por la concienciación del usuario adecuada.',
         TRUE, 70, now()),
        (v_fw_id, v_d_a8, 'A.8.8',  'Gestión de Vulnerabilidades Técnicas',
         'La información sobre las vulnerabilidades técnicas de los sistemas de información en uso se debe obtener, la exposición de la organización a dichas vulnerabilidades se debe evaluar y se deben tomar las medidas apropiadas.',
         TRUE, 80, now()),
        (v_fw_id, v_d_a8, 'A.8.9',  'Gestión de la Configuración',
         'Las configuraciones, incluidas las configuraciones de seguridad, del hardware, software, servicios y redes se deben establecer, documentar, implementar, monitorizar y revisar.',
         TRUE, 90, now()),
        (v_fw_id, v_d_a8, 'A.8.10', 'Eliminación de Información',
         'La información almacenada en sistemas de información, dispositivos o en cualquier otro medio de almacenamiento se debe eliminar cuando ya no sea necesaria.',
         TRUE, 100, now()),
        (v_fw_id, v_d_a8, 'A.8.11', 'Enmascaramiento de Datos',
         'El enmascaramiento de datos se debe usar de acuerdo con la política de control de acceso específica del tema de la organización y otros requisitos de negocio relacionados, teniendo en cuenta la legislación aplicable.',
         TRUE, 110, now()),
        (v_fw_id, v_d_a8, 'A.8.12', 'Prevención de Fuga de Datos',
         'Se deben aplicar medidas de prevención de fuga de datos a los sistemas, redes y cualquier otro dispositivo que procese, almacene o transmita información confidencial.',
         TRUE, 120, now()),
        (v_fw_id, v_d_a8, 'A.8.13', 'Copia de Seguridad de la Información',
         'Se deben mantener y probar regularmente las copias de seguridad de la información, del software y de los sistemas de acuerdo con la política de copia de seguridad específica del tema acordada.',
         TRUE, 130, now()),
        (v_fw_id, v_d_a8, 'A.8.14', 'Redundancia de las Instalaciones de Procesamiento de Información',
         'Las instalaciones de procesamiento de información se deben implementar con redundancia suficiente para cumplir los requisitos de disponibilidad.',
         TRUE, 140, now()),
        (v_fw_id, v_d_a8, 'A.8.15', 'Registro de Actividad (Logging)',
         'Se deben producir, almacenar, proteger y analizar los registros de actividad que registren actividades, excepciones, fallos y otros eventos relevantes.',
         TRUE, 150, now()),
        (v_fw_id, v_d_a8, 'A.8.16', 'Actividades de Monitoreo',
         'Las redes, sistemas y aplicaciones se deben monitorizar para detectar comportamientos anómalos y se deben tomar las acciones apropiadas para evaluar posibles incidentes de seguridad de la información.',
         TRUE, 160, now()),
        (v_fw_id, v_d_a8, 'A.8.17', 'Sincronización de Relojes',
         'Los relojes de los sistemas de procesamiento de información utilizados por la organización se deben sincronizar con fuentes de tiempo de referencia aprobadas.',
         TRUE, 170, now()),
        (v_fw_id, v_d_a8, 'A.8.18', 'Uso de Programas de Utilidades Privilegiados',
         'El uso de programas de utilidades que puedan ser capaces de anular los controles del sistema y de la aplicación debe restringirse y controlarse estrictamente.',
         TRUE, 180, now()),
        (v_fw_id, v_d_a8, 'A.8.19', 'Instalación de Software en Sistemas en Producción',
         'Se deben implementar procedimientos y medidas para gestionar de forma segura la instalación de software en los sistemas operativos.',
         TRUE, 190, now()),
        (v_fw_id, v_d_a8, 'A.8.20', 'Seguridad en Redes',
         'Las redes y dispositivos de red se deben proteger, gestionar y controlar para proteger la información en los sistemas y aplicaciones.',
         TRUE, 200, now()),
        (v_fw_id, v_d_a8, 'A.8.21', 'Seguridad de los Servicios de Red',
         'Los mecanismos de seguridad, los niveles de servicio y los requisitos de servicio de todos los servicios de red se deben identificar, implementar y monitorizar.',
         TRUE, 210, now()),
        (v_fw_id, v_d_a8, 'A.8.22', 'Separación de Redes',
         'Los grupos de servicios de información, usuarios y sistemas de información se deben separar en las redes de la organización.',
         TRUE, 220, now()),
        (v_fw_id, v_d_a8, 'A.8.23', 'Filtrado Web',
         'El acceso a sitios web externos se debe gestionar para reducir la exposición a contenido malicioso.',
         TRUE, 230, now()),
        (v_fw_id, v_d_a8, 'A.8.24', 'Uso de Criptografía',
         'Se deben definir e implementar reglas para el uso efectivo de la criptografía, incluida la gestión de claves criptográficas.',
         TRUE, 240, now()),
        (v_fw_id, v_d_a8, 'A.8.25', 'Ciclo de Vida del Desarrollo Seguro',
         'Se deben establecer e implementar reglas para el desarrollo seguro de software y sistemas.',
         TRUE, 250, now()),
        (v_fw_id, v_d_a8, 'A.8.26', 'Requisitos de Seguridad de las Aplicaciones',
         'Los requisitos de seguridad de la información se deben identificar, especificar y aprobar al desarrollar o adquirir aplicaciones.',
         TRUE, 260, now()),
        (v_fw_id, v_d_a8, 'A.8.27', 'Principios de Ingeniería de Sistemas Seguros',
         'Los principios para la ingeniería de sistemas seguros se deben establecer, documentar, mantener y aplicar a cualquier actividad de ingeniería de sistemas de información.',
         TRUE, 270, now()),
        (v_fw_id, v_d_a8, 'A.8.28', 'Codificación Segura',
         'Los principios de codificación segura se deben aplicar al desarrollo de software.',
         TRUE, 280, now()),
        (v_fw_id, v_d_a8, 'A.8.29', 'Pruebas de Seguridad en el Desarrollo y Aceptación',
         'Los procesos de prueba de seguridad se deben definir e implementar en el ciclo de vida del desarrollo.',
         TRUE, 290, now()),
        (v_fw_id, v_d_a8, 'A.8.30', 'Desarrollo Subcontratado',
         'La organización debe supervisar y monitorizar las actividades de desarrollo de sistemas subcontratadas.',
         TRUE, 300, now()),
        (v_fw_id, v_d_a8, 'A.8.31', 'Separación de los Entornos de Desarrollo, Prueba y Producción',
         'Los entornos de desarrollo, prueba y producción se deben separar y proteger.',
         TRUE, 310, now()),
        (v_fw_id, v_d_a8, 'A.8.32', 'Gestión del Cambio',
         'Los cambios en las instalaciones de procesamiento de información y los sistemas de información se deben someter a procedimientos de gestión del cambio.',
         TRUE, 320, now()),
        (v_fw_id, v_d_a8, 'A.8.33', 'Información de Prueba',
         'La información de prueba se debe seleccionar, proteger y gestionar apropiadamente.',
         TRUE, 330, now()),
        (v_fw_id, v_d_a8, 'A.8.34', 'Protección de los Sistemas de Información durante las Pruebas de Auditoría',
         'Las pruebas de auditoría y otras actividades de aseguramiento que involucren la evaluación de los sistemas operativos se deben planificar y acordar entre el evaluador y la dirección apropiada.',
         TRUE, 340, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

END $$;

-- =====================================================
-- ISO 22301:2019 — Business Continuity Management
-- 7 cláusulas (dominios) + ~30 requisitos
-- =====================================================
DO $$
DECLARE
    v_fw_id  UUID;
    v_d_c4   UUID;
    v_d_c5   UUID;
    v_d_c6   UUID;
    v_d_c7   UUID;
    v_d_c8   UUID;
    v_d_c9   UUID;
    v_d_c10  UUID;
BEGIN
    SELECT id INTO v_fw_id FROM frameworks WHERE code = 'iso22301';
    IF v_fw_id IS NULL THEN
        RAISE NOTICE 'Framework iso22301 not found, skipping.';
        RETURN;
    END IF;

    -- ── Domains (Cláusulas 4–10) ─────────────────────
    INSERT INTO framework_domains (id, framework_id, parent_id, code, name, level, sort_order, created_at)
    VALUES
        (gen_random_uuid(), v_fw_id, NULL, '4',  'Contexto de la Organización',          1, 10,  now()),
        (gen_random_uuid(), v_fw_id, NULL, '5',  'Liderazgo',                            1, 20,  now()),
        (gen_random_uuid(), v_fw_id, NULL, '6',  'Planificación',                        1, 30,  now()),
        (gen_random_uuid(), v_fw_id, NULL, '7',  'Apoyo',                                1, 40,  now()),
        (gen_random_uuid(), v_fw_id, NULL, '8',  'Operación',                            1, 50,  now()),
        (gen_random_uuid(), v_fw_id, NULL, '9',  'Evaluación del Desempeño',             1, 60,  now()),
        (gen_random_uuid(), v_fw_id, NULL, '10', 'Mejora',                               1, 70,  now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    SELECT id INTO v_d_c4  FROM framework_domains WHERE framework_id = v_fw_id AND code = '4';
    SELECT id INTO v_d_c5  FROM framework_domains WHERE framework_id = v_fw_id AND code = '5';
    SELECT id INTO v_d_c6  FROM framework_domains WHERE framework_id = v_fw_id AND code = '6';
    SELECT id INTO v_d_c7  FROM framework_domains WHERE framework_id = v_fw_id AND code = '7';
    SELECT id INTO v_d_c8  FROM framework_domains WHERE framework_id = v_fw_id AND code = '8';
    SELECT id INTO v_d_c9  FROM framework_domains WHERE framework_id = v_fw_id AND code = '9';
    SELECT id INTO v_d_c10 FROM framework_domains WHERE framework_id = v_fw_id AND code = '10';

    -- ── Cláusula 4 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_c4, '4.1', 'Comprensión de la Organización y su Contexto',
         'La organización debe determinar los factores externos e internos que son relevantes para su propósito y que afectan a su capacidad para lograr los resultados previstos de su sistema de gestión de la continuidad del negocio.',
         TRUE, 10, now()),
        (v_fw_id, v_d_c4, '4.2', 'Comprensión de las Necesidades y Expectativas de las Partes Interesadas',
         'La organización debe determinar las partes interesadas que son relevantes para el SGCN, y los requisitos de dichas partes interesadas.',
         TRUE, 20, now()),
        (v_fw_id, v_d_c4, '4.3', 'Determinación del Alcance del Sistema de Gestión de la Continuidad del Negocio',
         'La organización debe determinar los límites y la aplicabilidad del SGCN para establecer su alcance.',
         TRUE, 30, now()),
        (v_fw_id, v_d_c4, '4.4', 'Sistema de Gestión de la Continuidad del Negocio',
         'La organización debe establecer, implementar, mantener y mejorar continuamente el SGCN.',
         TRUE, 40, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Cláusula 5 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_c5, '5.1', 'Liderazgo y Compromiso',
         'La alta dirección debe demostrar liderazgo y compromiso con respecto al sistema de gestión de la continuidad del negocio.',
         TRUE, 10, now()),
        (v_fw_id, v_d_c5, '5.2', 'Política de Continuidad del Negocio',
         'La alta dirección debe establecer, revisar y aprobar una política de continuidad del negocio que sea apropiada al propósito de la organización.',
         TRUE, 20, now()),
        (v_fw_id, v_d_c5, '5.3', 'Roles, Responsabilidades y Autoridades en la Organización',
         'La alta dirección debe asegurarse de que las responsabilidades y autoridades para los roles relevantes se asignen y comuniquen dentro de la organización.',
         TRUE, 30, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Cláusula 6 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_c6, '6.1', 'Acciones para Abordar Riesgos y Oportunidades',
         'Al planificar el SGCN, la organización debe considerar los factores del contexto y determinar los riesgos y oportunidades que deben abordarse.',
         TRUE, 10, now()),
        (v_fw_id, v_d_c6, '6.2', 'Objetivos de Continuidad del Negocio y Planificación para Lograrlos',
         'La organización debe establecer objetivos de continuidad del negocio en las funciones y niveles relevantes.',
         TRUE, 20, now()),
        (v_fw_id, v_d_c6, '6.3', 'Planificación de Cambios',
         'La organización debe determinar la necesidad de cambios en el SGCN y gestionarlos de manera planificada.',
         TRUE, 30, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Cláusula 7 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_c7, '7.1', 'Recursos',
         'La organización debe determinar y proporcionar los recursos necesarios para el establecimiento, implementación, mantenimiento y mejora continua del SGCN.',
         TRUE, 10, now()),
        (v_fw_id, v_d_c7, '7.2', 'Competencia',
         'La organización debe determinar la competencia necesaria de las personas que realizan trabajos que afectan al desempeño del SGCN.',
         TRUE, 20, now()),
        (v_fw_id, v_d_c7, '7.3', 'Concienciación',
         'Las personas que realizan trabajos bajo el control de la organización deben ser conscientes de la política de continuidad del negocio y su contribución a la eficacia del SGCN.',
         TRUE, 30, now()),
        (v_fw_id, v_d_c7, '7.4', 'Comunicación',
         'La organización debe determinar las comunicaciones internas y externas relevantes para el SGCN.',
         TRUE, 40, now()),
        (v_fw_id, v_d_c7, '7.5', 'Información Documentada',
         'El SGCN de la organización debe incluir la información documentada requerida por la norma y la determinada por la organización como necesaria para la eficacia del SGCN.',
         TRUE, 50, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Cláusula 8 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_c8, '8.1', 'Planificación y Control Operacional',
         'La organización debe planificar, implementar, controlar, mantener y revisar los procesos necesarios para cumplir los requisitos de continuidad del negocio.',
         TRUE, 10, now()),
        (v_fw_id, v_d_c8, '8.2', 'Análisis de Impacto en el Negocio y Evaluación del Riesgo',
         'La organización debe establecer, implementar y mantener un proceso formal y documentado para el análisis de impacto en el negocio (BIA) y la evaluación del riesgo de continuidad del negocio.',
         TRUE, 20, now()),
        (v_fw_id, v_d_c8, '8.3', 'Estrategias y Soluciones de Continuidad del Negocio',
         'Sobre la base del análisis de impacto en el negocio y la evaluación del riesgo, la organización debe determinar e implementar estrategias y soluciones apropiadas de continuidad del negocio.',
         TRUE, 30, now()),
        (v_fw_id, v_d_c8, '8.4', 'Planes y Procedimientos de Continuidad del Negocio',
         'La organización debe documentar procedimientos para gestionar un incidente disruptivo y garantizar que la continuidad del negocio se puede lograr dentro del RTO.',
         TRUE, 40, now()),
        (v_fw_id, v_d_c8, '8.5', 'Programa de Ejercicios y Pruebas',
         'La organización debe establecer, implementar y mantener un programa de ejercicios y pruebas del SGCN para verificar que sus procedimientos de continuidad del negocio son consistentes con sus objetivos.',
         TRUE, 50, now()),
        (v_fw_id, v_d_c8, '8.6', 'Evaluación de la Documentación y Capacidades de Continuidad del Negocio',
         'La organización debe revisar sus capacidades de continuidad del negocio después de ejercicios, pruebas, e incidentes disruptivos reales.',
         TRUE, 60, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Cláusula 9 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_c9, '9.1', 'Seguimiento, Medición, Análisis y Evaluación',
         'La organización debe determinar qué necesita seguimiento y medición, incluyendo los procesos y controles del SGCN.',
         TRUE, 10, now()),
        (v_fw_id, v_d_c9, '9.2', 'Auditoría Interna',
         'La organización debe llevar a cabo auditorías internas a intervalos planificados para proporcionar información sobre si el SGCN es conforme con los requisitos de la organización y con los de la norma.',
         TRUE, 20, now()),
        (v_fw_id, v_d_c9, '9.3', 'Revisión por la Dirección',
         'La alta dirección debe revisar el SGCN de la organización a intervalos planificados para asegurarse de su conveniencia, adecuación y eficacia continuas.',
         TRUE, 30, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Cláusula 10 ──────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_c10, '10.1', 'No Conformidad y Acción Correctiva',
         'Cuando ocurra una no conformidad, la organización debe tomar acciones para controlarla, corregirla, hacer frente a las consecuencias, e implementar acciones correctivas.',
         TRUE, 10, now()),
        (v_fw_id, v_d_c10, '10.2', 'Mejora Continua',
         'La organización debe mejorar continuamente la conveniencia, adecuación y eficacia del SGCN.',
         TRUE, 20, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

END $$;

-- =====================================================
-- NIST CSF 2.0 — 6 funciones (dominios) + 24 categorías
-- =====================================================
DO $$
DECLARE
    v_fw_id  UUID;
    v_d_gv   UUID;
    v_d_id   UUID;
    v_d_pr   UUID;
    v_d_de   UUID;
    v_d_rs   UUID;
    v_d_rc   UUID;
BEGIN
    SELECT id INTO v_fw_id FROM frameworks WHERE code = 'nist_csf';
    IF v_fw_id IS NULL THEN
        RAISE NOTICE 'Framework nist_csf not found, skipping.';
        RETURN;
    END IF;

    -- ── Domains (Funciones) ──────────────────────────
    INSERT INTO framework_domains (id, framework_id, parent_id, code, name, level, sort_order, created_at)
    VALUES
        (gen_random_uuid(), v_fw_id, NULL, 'GV', 'GOBERNAR (Govern)',    1, 10, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'ID', 'IDENTIFICAR (Identify)',1, 20, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'PR', 'PROTEGER (Protect)',   1, 30, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'DE', 'DETECTAR (Detect)',    1, 40, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'RS', 'RESPONDER (Respond)',  1, 50, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'RC', 'RECUPERAR (Recover)',  1, 60, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    SELECT id INTO v_d_gv FROM framework_domains WHERE framework_id = v_fw_id AND code = 'GV';
    SELECT id INTO v_d_id FROM framework_domains WHERE framework_id = v_fw_id AND code = 'ID';
    SELECT id INTO v_d_pr FROM framework_domains WHERE framework_id = v_fw_id AND code = 'PR';
    SELECT id INTO v_d_de FROM framework_domains WHERE framework_id = v_fw_id AND code = 'DE';
    SELECT id INTO v_d_rs FROM framework_domains WHERE framework_id = v_fw_id AND code = 'RS';
    SELECT id INTO v_d_rc FROM framework_domains WHERE framework_id = v_fw_id AND code = 'RC';

    -- ── GV — GOBERNAR (6 categorías) ─────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_gv, 'GV.OC', 'Contexto Organizacional (Organizational Context)',
         'Las circunstancias que rodean la misión de ciberseguridad de la organización se entienden para priorizar las actividades de gestión de riesgos de ciberseguridad.',
         TRUE, 10, now()),
        (v_fw_id, v_d_gv, 'GV.RM', 'Estrategia de Gestión del Riesgo (Risk Management Strategy)',
         'Las prioridades, restricciones, declaraciones de apetito de riesgo y tolerancias al riesgo de la organización se establecen, comunican y se utilizan para apoyar las decisiones de riesgo operativo.',
         TRUE, 20, now()),
        (v_fw_id, v_d_gv, 'GV.RR', 'Roles, Responsabilidades y Autoridades (Roles, Responsibilities & Authorities)',
         'Los roles, responsabilidades y autoridades de ciberseguridad se establecen y comunican para fomentar la rendición de cuentas, la evaluación del desempeño y la mejora continua.',
         TRUE, 30, now()),
        (v_fw_id, v_d_gv, 'GV.PO', 'Política (Policy)',
         'La política de ciberseguridad de la organización, las expectativas y las instrucciones se establecen con base en el contexto organizacional, la estrategia de gestión de riesgos y la apetencia al riesgo.',
         TRUE, 40, now()),
        (v_fw_id, v_d_gv, 'GV.OV', 'Supervisión (Oversight)',
         'Los resultados de las actividades y el desempeño de la gestión de riesgos de ciberseguridad de la organización se utilizan para informar, mejorar y ajustar la estrategia de riesgos.',
         TRUE, 50, now()),
        (v_fw_id, v_d_gv, 'GV.SC', 'Gestión de Riesgos de la Cadena de Suministro (Cybersecurity Supply Chain Risk Management)',
         'Los riesgos de ciberseguridad en la cadena de suministro se identifican, establecen prioridades y se gestionan de manera coherente con los roles de la cadena de suministro de la organización, sus obligaciones contractuales y los requisitos de los clientes.',
         TRUE, 60, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── ID — IDENTIFICAR (3 categorías) ─────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_id, 'ID.AM', 'Gestión de Activos (Asset Management)',
         'Los activos (datos, hardware, software, sistemas, instalaciones, servicios, personas) que permiten a la organización lograr sus propósitos de negocio se identifican y gestionan de manera coherente con su importancia relativa para los objetivos organizacionales y la estrategia de riesgos.',
         TRUE, 10, now()),
        (v_fw_id, v_d_id, 'ID.RA', 'Evaluación de Riesgos (Risk Assessment)',
         'La organización comprende el riesgo de ciberseguridad para las operaciones organizacionales (incluyendo misión, funciones, imagen y reputación), activos organizacionales e individuos.',
         TRUE, 20, now()),
        (v_fw_id, v_d_id, 'ID.IM', 'Mejora (Improvement)',
         'Las mejoras a la postura de ciberseguridad de la organización se identifican a partir de evaluaciones, lecciones aprendidas y revisiones de indicadores de paridad.',
         TRUE, 30, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── PR — PROTEGER (6 categorías) ─────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_pr, 'PR.AA', 'Gestión de Identidad, Autenticación y Control de Acceso (Identity Management, Authentication & Access Control)',
         'El acceso a los activos físicos y lógicos se gestiona de manera coherente con el riesgo evaluado de acceso no autorizado a actividades y transacciones autorizadas.',
         TRUE, 10, now()),
        (v_fw_id, v_d_pr, 'PR.AT', 'Concienciación y Formación (Awareness and Training)',
         'El personal de la organización recibe concienciación en ciberseguridad y se forma para realizar sus actividades relacionadas con la ciberseguridad.',
         TRUE, 20, now()),
        (v_fw_id, v_d_pr, 'PR.DS', 'Seguridad de los Datos (Data Security)',
         'Los datos se gestionan de manera coherente con la estrategia de riesgos de la organización para proteger la confidencialidad, integridad y disponibilidad de la información.',
         TRUE, 30, now()),
        (v_fw_id, v_d_pr, 'PR.PS', 'Seguridad de la Plataforma (Platform Security)',
         'El hardware, software (incluyendo firmware) y los servicios se gestionan de manera coherente con la estrategia de riesgos de la organización para proteger su confidencialidad, integridad y disponibilidad.',
         TRUE, 40, now()),
        (v_fw_id, v_d_pr, 'PR.IR', 'Gestión de Infraestructura Resistente (Technology Infrastructure Resilience)',
         'Las arquitecturas de seguridad se gestionan con los datos, el hardware, el software y los servicios de la organización en mente para facilitar la consecución de objetivos de ciberseguridad.',
         TRUE, 50, now()),
        (v_fw_id, v_d_pr, 'PR.MA', 'Mantenimiento (Maintenance)',
         'El mantenimiento y las reparaciones de los componentes de los activos organizacionales se realizan de manera coherente con las políticas y los procedimientos.',
         TRUE, 60, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── DE — DETECTAR (2 categorías) ─────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_de, 'DE.CM', 'Monitoreo Continuo (Continuous Monitoring)',
         'Los activos de información y los sistemas de información se monitorizan para identificar eventos de ciberseguridad y verificar la eficacia de las medidas de protección.',
         TRUE, 10, now()),
        (v_fw_id, v_d_de, 'DE.AE', 'Análisis de Eventos Adversos (Adverse Event Analysis)',
         'Las anomalías, indicadores de compromiso y otros eventos potencialmente adversos se analizan para caracterizar los incidentes y apoyar las actividades de respuesta.',
         TRUE, 20, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── RS — RESPONDER (5 categorías) ────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_rs, 'RS.MA', 'Gestión de Incidentes (Incident Management)',
         'Las respuestas a los incidentes detectados de ciberseguridad se gestionan.',
         TRUE, 10, now()),
        (v_fw_id, v_d_rs, 'RS.AN', 'Análisis de Incidentes (Incident Analysis)',
         'Las investigaciones se realizan para garantizar una respuesta eficaz y apoyar las actividades forenses y de recuperación.',
         TRUE, 20, now()),
        (v_fw_id, v_d_rs, 'RS.CO', 'Reporte y Comunicación de Incidentes (Incident Response Reporting & Communication)',
         'Las actividades de respuesta se coordinan con las partes interesadas internas y externas según lo requerido por las leyes, regulaciones o políticas aplicables.',
         TRUE, 30, now()),
        (v_fw_id, v_d_rs, 'RS.MI', 'Mitigación de Incidentes (Incident Mitigation)',
         'Las actividades se realizan para evitar la expansión de un evento, mitigar sus efectos y erradicar el incidente.',
         TRUE, 40, now()),
        (v_fw_id, v_d_rs, 'RS.RP', 'Ejecución del Plan de Respuesta (Incident Response Plan Execution)',
         'Los planes de respuesta se ejecutan durante o después de un incidente.',
         TRUE, 50, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── RC — RECUPERAR (2 categorías) ────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_rc, 'RC.RP', 'Ejecución del Plan de Recuperación (Recovery Plan Execution)',
         'Los planes de recuperación se ejecutan una vez que el incidente está resuelto.',
         TRUE, 10, now()),
        (v_fw_id, v_d_rc, 'RC.CO', 'Comunicación de Recuperación (Recovery Communication)',
         'Las actividades de restauración se coordinan con las partes internas y externas (p. ej., centros de coordinación, proveedores de Internet, propietarios de sistemas atacantes, víctimas, otros CSIRT y proveedores).',
         TRUE, 20, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

END $$;

-- =====================================================
-- PCI DSS 4.0 — 12 requisitos principales (dominios)
-- con sub-requisitos clave (~40 total)
-- =====================================================
DO $$
DECLARE
    v_fw_id   UUID;
    v_d_r1    UUID;
    v_d_r2    UUID;
    v_d_r3    UUID;
    v_d_r4    UUID;
    v_d_r5    UUID;
    v_d_r6    UUID;
    v_d_r7    UUID;
    v_d_r8    UUID;
    v_d_r9    UUID;
    v_d_r10   UUID;
    v_d_r11   UUID;
    v_d_r12   UUID;
BEGIN
    SELECT id INTO v_fw_id FROM frameworks WHERE code = 'pci_dss';
    IF v_fw_id IS NULL THEN
        RAISE NOTICE 'Framework pci_dss not found, skipping.';
        RETURN;
    END IF;

    -- ── Domains (12 Requisitos Principales) ──────────
    INSERT INTO framework_domains (id, framework_id, parent_id, code, name, level, sort_order, created_at)
    VALUES
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-01',  'Instalar y Mantener Controles de Seguridad de Red',                                     1, 10,  now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-02',  'Aplicar Configuraciones Seguras a Todos los Componentes del Sistema',                    1, 20,  now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-03',  'Proteger los Datos de Cuenta Almacenados',                                              1, 30,  now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-04',  'Proteger los Datos del Titular de la Tarjeta con Criptografía Fuerte durante la Transmisión', 1, 40, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-05',  'Proteger Todos los Sistemas y Redes del Software Malicioso',                            1, 50,  now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-06',  'Desarrollar y Mantener Sistemas y Software Seguros',                                    1, 60,  now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-07',  'Restringir el Acceso a los Componentes del Sistema y a los Datos del Titular de la Tarjeta según la Necesidad de Saber del Negocio', 1, 70, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-08',  'Identificar a los Usuarios y Autenticar el Acceso a los Componentes del Sistema',        1, 80,  now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-09',  'Restringir el Acceso Físico a los Datos del Titular de la Tarjeta',                     1, 90,  now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-10',  'Registrar y Monitorear Todo el Acceso a los Componentes del Sistema y a los Datos del Titular de la Tarjeta', 1, 100, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-11',  'Probar la Seguridad de los Sistemas y Redes Regularmente',                              1, 110, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'REQ-12',  'Apoyar la Seguridad de la Información con Políticas y Programas Organizacionales',       1, 120, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    SELECT id INTO v_d_r1  FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-01';
    SELECT id INTO v_d_r2  FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-02';
    SELECT id INTO v_d_r3  FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-03';
    SELECT id INTO v_d_r4  FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-04';
    SELECT id INTO v_d_r5  FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-05';
    SELECT id INTO v_d_r6  FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-06';
    SELECT id INTO v_d_r7  FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-07';
    SELECT id INTO v_d_r8  FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-08';
    SELECT id INTO v_d_r9  FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-09';
    SELECT id INTO v_d_r10 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-10';
    SELECT id INTO v_d_r11 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-11';
    SELECT id INTO v_d_r12 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'REQ-12';

    -- ── Requisito 1 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r1, '1.1', 'Políticas y Procedimientos de Seguridad de Red',
         'Los procesos y mecanismos para instalar y mantener controles de seguridad de red se definen y entienden.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r1, '1.2', 'Controles de Seguridad de Red',
         'Los controles de seguridad de red (NSC) se configuran y mantienen.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r1, '1.3', 'Restricción del Tráfico de Red desde el CDE hacia Internet',
         'El acceso de red hacia y desde el entorno de datos del titular de la tarjeta (CDE) se restringe.',
         TRUE, 30, now()),
        (v_fw_id, v_d_r1, '1.4', 'Controles entre Redes Confiables y No Confiables',
         'Los controles de seguridad de red se implementan entre redes confiables y no confiables.',
         TRUE, 40, now()),
        (v_fw_id, v_d_r1, '1.5', 'Riesgos de Dispositivos Informáticos Personales de los Consumidores',
         'Los riesgos para el CDE de dispositivos informáticos personales de los consumidores (BYOD) capaces de conectarse a Internet se gestionan.',
         TRUE, 50, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 2 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r2, '2.1', 'Políticas y Procedimientos de Configuración Segura',
         'Los procesos y mecanismos para aplicar configuraciones seguras a todos los componentes del sistema se definen y entienden.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r2, '2.2', 'Configuración de Componentes del Sistema',
         'Los componentes del sistema se configuran y administran de forma segura.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r2, '2.3', 'Entornos Inalámbricos',
         'Los entornos inalámbricos se configuran y gestionan de forma segura.',
         TRUE, 30, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 3 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r3, '3.1', 'Políticas y Procedimientos de Protección de Datos de Cuenta Almacenados',
         'Los procesos y mecanismos para proteger los datos de cuenta almacenados se definen y entienden.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r3, '3.2', 'Retención y Eliminación de Datos de Almacenamiento de Datos de Cuenta',
         'El almacenamiento de datos de cuenta se mantiene al mínimo mediante políticas, procedimientos y procesos de retención y eliminación de datos.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r3, '3.3', 'Datos de Autenticación Confidenciales (SAD)',
         'Los datos de autenticación confidenciales (SAD) no se retienen después de la autorización.',
         TRUE, 30, now()),
        (v_fw_id, v_d_r3, '3.4', 'Acceso al Número de Cuenta Primario (PAN)',
         'El acceso al número de cuenta primario (PAN) se restringe.',
         TRUE, 40, now()),
        (v_fw_id, v_d_r3, '3.5', 'Protección Criptográfica del PAN',
         'El número de cuenta primario (PAN) se protege donde esté almacenado.',
         TRUE, 50, now()),
        (v_fw_id, v_d_r3, '3.6', 'Gestión de Claves Criptográficas',
         'Las claves criptográficas utilizadas para proteger los datos de cuenta almacenados se protegen.',
         TRUE, 60, now()),
        (v_fw_id, v_d_r3, '3.7', 'Procedimientos y Procesos de Gestión de Claves Criptográficas',
         'Cuando se utiliza criptografía para proteger los datos de cuenta almacenados, se implementan procedimientos y procesos de gestión de claves.',
         TRUE, 70, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 4 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r4, '4.1', 'Políticas y Procedimientos de Transmisión Segura',
         'Los procesos y mecanismos para proteger los datos del titular de la tarjeta durante la transmisión se definen y documentan.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r4, '4.2', 'Transmisión Segura del PAN',
         'El PAN está protegido con criptografía fuerte durante la transmisión.',
         TRUE, 20, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 5 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r5, '5.1', 'Políticas y Procedimientos contra Malware',
         'Los procesos y mecanismos para proteger todos los sistemas y redes del software malicioso se definen y entienden.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r5, '5.2', 'Soluciones anti-malware',
         'El software malicioso (malware) se previene, o se detecta y aborda.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r5, '5.3', 'Gestión de la Solución anti-malware',
         'Los mecanismos anti-malware y sus procesos se mantienen activos, se monitorean y no pueden ser deshabilitados por usuarios no autorizados.',
         TRUE, 30, now()),
        (v_fw_id, v_d_r5, '5.4', 'Protección del Personal contra Ataques de Phishing',
         'Los procesos y mecanismos para detectar y proteger al personal contra ataques de phishing están implementados.',
         TRUE, 40, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 6 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r6, '6.1', 'Políticas y Procedimientos de Desarrollo Seguro',
         'Los procesos y mecanismos para desarrollar y mantener sistemas y software seguros se definen y entienden.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r6, '6.2', 'Seguridad del Software',
         'El software desarrollado a medida y personalizado se desarrolla de forma segura.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r6, '6.3', 'Vulnerabilidades de Seguridad Identificadas y Abordadas',
         'Las vulnerabilidades de seguridad se identifican y abordan.',
         TRUE, 30, now()),
        (v_fw_id, v_d_r6, '6.4', 'Aplicaciones Web y API Públicas',
         'Las aplicaciones web de cara al público y las API se protegen contra ataques.',
         TRUE, 40, now()),
        (v_fw_id, v_d_r6, '6.5', 'Cambios en Todos los Componentes del Sistema se Gestionan de Forma Segura',
         'Todos los cambios a los componentes del sistema en el entorno de producción se realizan de acuerdo a las políticas y procedimientos establecidos.',
         TRUE, 50, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 7 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r7, '7.1', 'Políticas y Procedimientos de Control de Acceso',
         'Los procesos y mecanismos para restringir el acceso a componentes del sistema y datos del titular de tarjeta se definen y entienden.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r7, '7.2', 'Sistema de Control de Acceso',
         'El acceso a los componentes del sistema y a los datos se gestiona apropiadamente a través de un sistema de control de acceso.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r7, '7.3', 'Gestión de Acceso de Usuarios y Administradores',
         'El acceso de usuarios y administradores a los componentes del sistema se gestiona y mantiene.',
         TRUE, 30, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 8 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r8, '8.1', 'Políticas y Procedimientos de Identificación y Autenticación',
         'Los procesos y mecanismos para identificar usuarios y autenticar el acceso a los componentes del sistema se definen y entienden.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r8, '8.2', 'Identificación de Usuarios y Cuentas Relacionadas',
         'Toda identidad de usuario y las credenciales para usuarios y administradores se gestionan rigurosamente durante todo su ciclo de vida.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r8, '8.3', 'Autenticación Fuerte de Usuarios',
         'La autenticación de usuarios y administradores a los componentes del sistema se gestiona vía autenticación fuerte.',
         TRUE, 30, now()),
        (v_fw_id, v_d_r8, '8.4', 'Autenticación Multifactor (MFA) para el CDE',
         'La autenticación multifactor se implementa para gestionar el acceso al CDE.',
         TRUE, 40, now()),
        (v_fw_id, v_d_r8, '8.5', 'Sistemas de Autenticación Multifactor',
         'Los sistemas de autenticación multifactor se configuran de forma segura.',
         TRUE, 50, now()),
        (v_fw_id, v_d_r8, '8.6', 'Uso de Cuentas de Sistema y de Aplicación',
         'El uso de cuentas de aplicaciones y del sistema y de los factores de autenticación asociados se gestiona rigurosamente.',
         TRUE, 60, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 9 ───────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r9, '9.1', 'Políticas y Procedimientos de Acceso Físico',
         'Los procesos y mecanismos para restringir el acceso físico a los datos del titular de la tarjeta se definen y entienden.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r9, '9.2', 'Controles de Acceso Físico a Áreas Sensibles',
         'Los controles de acceso físico a los componentes del sistema en el CDE se implementan.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r9, '9.3', 'Controles de Acceso Físico para Personal y Visitantes',
         'El acceso físico del personal y los visitantes a las áreas sensibles se controla.',
         TRUE, 30, now()),
        (v_fw_id, v_d_r9, '9.4', 'Protección de Medios con Datos del Titular de la Tarjeta',
         'Los medios con datos del titular de la tarjeta están protegidos.',
         TRUE, 40, now()),
        (v_fw_id, v_d_r9, '9.5', 'Dispositivos de Punto de Interacción (POI)',
         'Los dispositivos de punto de interacción que capturan datos de tarjetas de pago a través de la interacción física directa del titular de la tarjeta se protegen contra la manipulación y la sustitución no autorizadas.',
         TRUE, 50, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 10 ──────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r10, '10.1', 'Políticas y Procedimientos de Auditoría y Registros',
         'Los procesos y mecanismos para registrar y monitorear todo el acceso a los componentes del sistema y a los datos del titular de la tarjeta se definen y documentan.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r10, '10.2', 'Implementación de Registros de Auditoría',
         'Los registros de auditoría están habilitados y activos para todos los componentes del sistema.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r10, '10.3', 'Protección de los Registros de Auditoría',
         'Los registros de auditoría se protegen de la destrucción y las modificaciones no autorizadas.',
         TRUE, 30, now()),
        (v_fw_id, v_d_r10, '10.4', 'Revisión de los Registros de Auditoría',
         'Los registros de auditoría se revisan para identificar anomalías o actividades sospechosas.',
         TRUE, 40, now()),
        (v_fw_id, v_d_r10, '10.5', 'Retención de Registros de Auditoría',
         'El historial de registros de auditoría se conserva y está disponible para análisis.',
         TRUE, 50, now()),
        (v_fw_id, v_d_r10, '10.6', 'Sincronización de Tiempo',
         'Los relojes y el tiempo en todos los componentes del sistema críticos se sincronizan.',
         TRUE, 60, now()),
        (v_fw_id, v_d_r10, '10.7', 'Detección y Reporte de Fallos en Controles de Seguridad',
         'Los fallos de los controles de seguridad críticos se detectan, reportan y responden oportunamente.',
         TRUE, 70, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 11 ──────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r11, '11.1', 'Políticas y Procedimientos de Pruebas de Seguridad',
         'Los procesos y mecanismos para probar regularmente la seguridad de los sistemas y redes se definen y entienden.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r11, '11.2', 'Gestión de Puntos de Acceso Inalámbrico',
         'Los puntos de acceso inalámbrico autorizados y no autorizados se gestionan.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r11, '11.3', 'Pruebas de Vulnerabilidades Externas e Internas',
         'Las vulnerabilidades externas e internas se identifican, priorizan y tratan regularmente.',
         TRUE, 30, now()),
        (v_fw_id, v_d_r11, '11.4', 'Pruebas de Penetración Externas e Internas',
         'Las intrusiones externas e internas se detectan y se previenen mediante pruebas de penetración.',
         TRUE, 40, now()),
        (v_fw_id, v_d_r11, '11.5', 'Detección de Intrusiones y Monitoreo del Cambio de Archivos',
         'Las intrusiones de red y los cambios inesperados de archivos se detectan y se reacciona ante ellos.',
         TRUE, 50, now()),
        (v_fw_id, v_d_r11, '11.6', 'Cambios No Autorizados en Páginas de Pago',
         'Los cambios no autorizados en páginas de pago se detectan y se reacciona ante ellos.',
         TRUE, 60, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Requisito 12 ──────────────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_r12, '12.1', 'Política General de Seguridad de la Información',
         'Una política general de seguridad de la información se establece, publica, mantiene y difunde a todas las partes relevantes.',
         TRUE, 10, now()),
        (v_fw_id, v_d_r12, '12.2', 'Políticas Específicas por Tema',
         'Las políticas específicas por tema se establecen, publican, mantienen y difunden a todas las partes relevantes.',
         TRUE, 20, now()),
        (v_fw_id, v_d_r12, '12.3', 'Gestión de Riesgos de Tecnologías Críticas',
         'Los riesgos de las tecnologías utilizadas por los usuarios finales se gestionan.',
         TRUE, 30, now()),
        (v_fw_id, v_d_r12, '12.4', 'Cumplimiento de PCI DSS por Proveedores de Servicios',
         'El cumplimiento de PCI DSS se gestiona a través de los proveedores de servicios.',
         TRUE, 40, now()),
        (v_fw_id, v_d_r12, '12.5', 'Alcance del Entorno del Titular de la Tarjeta (CDE)',
         'El alcance del CDE se documenta y valida.',
         TRUE, 50, now()),
        (v_fw_id, v_d_r12, '12.6', 'Concienciación en Seguridad y Programas de Formación',
         'Un programa de concienciación en seguridad para proteger el CDE se implementa.',
         TRUE, 60, now()),
        (v_fw_id, v_d_r12, '12.7', 'Personal Seleccionado para Proteger el CDE',
         'Se realiza una selección adecuada del personal para minimizar el riesgo interno.',
         TRUE, 70, now()),
        (v_fw_id, v_d_r12, '12.8', 'Gestión del Riesgo de Proveedores de Servicios Externos',
         'El riesgo de los proveedores de servicios que comparten datos del titular de la tarjeta o que podrían afectar la seguridad de los datos del titular de la tarjeta se gestionan.',
         TRUE, 80, now()),
        (v_fw_id, v_d_r12, '12.9', 'Responsabilidades de los Proveedores de Servicios para con los Clientes',
         'Los proveedores de servicios respaldan las solicitudes de información de sus clientes.',
         TRUE, 90, now()),
        (v_fw_id, v_d_r12, '12.10', 'Planes de Respuesta a Incidentes de Seguridad',
         'Los incidentes de seguridad se detectan, reportan y responden de forma oportuna.',
         TRUE, 100, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

END $$;

-- =====================================================
-- LEY 1581 DE 2012 (Colombia) — Protección de Datos
-- 5 dominios + 15 requisitos
-- =====================================================
DO $$
DECLARE
    v_fw_id  UUID;
    v_d_p1   UUID;
    v_d_p2   UUID;
    v_d_p3   UUID;
    v_d_p4   UUID;
    v_d_p5   UUID;
BEGIN
    SELECT id INTO v_fw_id FROM frameworks WHERE code = 'ley_1581';
    IF v_fw_id IS NULL THEN
        RAISE NOTICE 'Framework ley_1581 not found, skipping.';
        RETURN;
    END IF;

    -- ── Domains ──────────────────────────────────────
    INSERT INTO framework_domains (id, framework_id, parent_id, code, name, level, sort_order, created_at)
    VALUES
        (gen_random_uuid(), v_fw_id, NULL, 'L1581-P1', 'Principios del Tratamiento de Datos',             1, 10, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'L1581-P2', 'Autorización y Consentimiento del Titular',        1, 20, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'L1581-P3', 'Derechos del Titular',                             1, 30, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'L1581-P4', 'Obligaciones del Responsable y Encargado',         1, 40, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'L1581-P5', 'Transferencia y Transmisión Internacional de Datos',1, 50, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    SELECT id INTO v_d_p1 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'L1581-P1';
    SELECT id INTO v_d_p2 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'L1581-P2';
    SELECT id INTO v_d_p3 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'L1581-P3';
    SELECT id INTO v_d_p4 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'L1581-P4';
    SELECT id INTO v_d_p5 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'L1581-P5';

    -- ── Dominio 1: Principios ─────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_p1, 'L1581-1.1', 'Principio de Legalidad',
         'El tratamiento de datos personales debe realizarse conforme a las disposiciones legales vigentes. La recolección, uso y circulación de datos personales requiere de autorización previa e informada del Titular, salvo las excepciones previstas en la ley.',
         TRUE, 10, now()),
        (v_fw_id, v_d_p1, 'L1581-1.2', 'Principio de Finalidad',
         'El tratamiento debe obedecer a una finalidad legítima acorde con la Constitución y la ley, la cual debe ser informada al Titular. Los datos personales no podrán ser utilizados para finalidades distintas para las que fueron recolectados.',
         TRUE, 20, now()),
        (v_fw_id, v_d_p1, 'L1581-1.3', 'Principio de Libertad',
         'El tratamiento sólo puede ejercerse con el consentimiento, previo, expreso e informado del Titular. Los datos personales no podrán ser obtenidos o divulgados sin previa autorización, o en ausencia de mandato legal o judicial que releve el consentimiento.',
         TRUE, 30, now()),
        (v_fw_id, v_d_p1, 'L1581-1.4', 'Principios de Veracidad, Calidad y Seguridad',
         'La información sujeta a tratamiento debe ser veraz, completa, exacta, actualizada, comprobable y comprensible. Se prohíbe el tratamiento de datos parciales, incompletos, fraccionados o que induzcan a error. El Responsable debe adoptar las medidas técnicas, humanas y administrativas necesarias para otorgar seguridad a los registros evitando su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento.',
         TRUE, 40, now()),
        (v_fw_id, v_d_p1, 'L1581-1.5', 'Principio de Transparencia y Acceso y Circulación Restringida',
         'El Responsable garantizará al Titular su derecho a obtener en cualquier momento y sin restricciones, información acerca de la existencia de datos que le conciernan. El tratamiento sólo puede hacerse por personas autorizadas por el Titular y/o por las personas previstas en la ley.',
         TRUE, 50, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Dominio 2: Autorización ───────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_p2, 'L1581-2.1', 'Autorización Previa e Informada',
         'El Responsable del Tratamiento debe obtener la autorización previa, expresa e informada del Titular de los datos personales, salvo en los casos expresamente exceptuados por el artículo 10 de la Ley 1581 de 2012.',
         TRUE, 10, now()),
        (v_fw_id, v_d_p2, 'L1581-2.2', 'Aviso de Privacidad',
         'El Responsable del Tratamiento debe comunicar al Titular previamente al tratamiento de sus datos personales la información mínima requerida, incluyendo: la identidad del responsable, la finalidad del tratamiento, los derechos del titular y los mecanismos para ejercerlos.',
         TRUE, 20, now()),
        (v_fw_id, v_d_p2, 'L1581-2.3', 'Datos Sensibles',
         'El tratamiento de datos sensibles (origen racial o étnico, orientación política, convicciones religiosas, datos de salud, vida sexual, datos biométricos) queda prohibido salvo que el titular otorgue su autorización explícita, o en las excepciones previstas por la ley.',
         TRUE, 30, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Dominio 3: Derechos del Titular ──────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_p3, 'L1581-3.1', 'Derecho de Acceso y Conocimiento',
         'El Titular tiene derecho a conocer, actualizar y rectificar sus datos personales. El Responsable debe garantizar el acceso al Titular a los datos que reposan en sus bases de datos.',
         TRUE, 10, now()),
        (v_fw_id, v_d_p3, 'L1581-3.2', 'Derecho de Supresión y Revocación',
         'El Titular tiene derecho a solicitar la supresión de sus datos personales cuando el tratamiento no respete los principios, derechos y garantías constitucionales y legales, así como revocar la autorización en cualquier momento.',
         TRUE, 20, now()),
        (v_fw_id, v_d_p3, 'L1581-3.3', 'Derecho a Presentar Quejas ante la SIC',
         'El Titular tiene derecho a acudir ante la Superintendencia de Industria y Comercio (SIC) para presentar quejas por infracciones a las disposiciones de la Ley 1581 de 2012.',
         TRUE, 30, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Dominio 4: Obligaciones ───────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_p4, 'L1581-4.1', 'Registro Nacional de Bases de Datos (RNBD)',
         'Los Responsables del Tratamiento deben registrar sus bases de datos que contengan datos personales ante el Registro Nacional de Bases de Datos (RNBD) administrado por la SIC.',
         TRUE, 10, now()),
        (v_fw_id, v_d_p4, 'L1581-4.2', 'Política de Tratamiento de Información y Manual Interno',
         'El Responsable debe elaborar y adoptar una política de tratamiento de la información y un manual interno de políticas y procedimientos que garantice el adecuado cumplimiento de la ley, incluyendo mecanismos de atención de consultas y reclamos.',
         TRUE, 20, now()),
        (v_fw_id, v_d_p4, 'L1581-4.3', 'Medidas de Seguridad y Notificación de Incidentes',
         'El Responsable debe implementar medidas de seguridad técnicas, administrativas y humanas para proteger los datos. En caso de incidentes de seguridad que afecten datos personales, debe notificar a la SIC y al Titular afectado.',
         TRUE, 30, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Dominio 5: Transferencia Internacional ───────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_p5, 'L1581-5.1', 'Transferencia Internacional de Datos',
         'La transferencia de datos personales a países que no proporcionen niveles adecuados de protección de datos está prohibida, salvo autorización del Titular, necesidad contractual, o que el país receptor cuente con niveles de protección adecuados reconocidos por la SIC.',
         TRUE, 10, now()),
        (v_fw_id, v_d_p5, 'L1581-5.2', 'Transmisión de Datos a Encargados',
         'La transmisión de datos personales a un Encargado del Tratamiento (en Colombia o en el exterior) debe estar amparada en un contrato de transmisión de datos que incluya las obligaciones del Encargado de mantener la confidencialidad y seguridad de los datos.',
         TRUE, 20, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

END $$;

-- =====================================================
-- DECRETO 338 DE 2022 (Colombia) — Seguridad Digital
-- 4 dominios + 20 requisitos
-- =====================================================
DO $$
DECLARE
    v_fw_id  UUID;
    v_d_d1   UUID;
    v_d_d2   UUID;
    v_d_d3   UUID;
    v_d_d4   UUID;
BEGIN
    SELECT id INTO v_fw_id FROM frameworks WHERE code = 'decreto_338';
    IF v_fw_id IS NULL THEN
        RAISE NOTICE 'Framework decreto_338 not found, skipping.';
        RETURN;
    END IF;

    -- ── Domains ──────────────────────────────────────
    INSERT INTO framework_domains (id, framework_id, parent_id, code, name, level, sort_order, created_at)
    VALUES
        (gen_random_uuid(), v_fw_id, NULL, 'D338-GOB', 'Gobernanza de Seguridad Digital',                  1, 10, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'D338-GR',  'Gestión de Riesgos de Seguridad Digital',          1, 20, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'D338-CAP', 'Capacidades de Seguridad Digital',                 1, 30, now()),
        (gen_random_uuid(), v_fw_id, NULL, 'D338-INC', 'Gestión de Incidentes de Seguridad Digital',       1, 40, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    SELECT id INTO v_d_d1 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'D338-GOB';
    SELECT id INTO v_d_d2 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'D338-GR';
    SELECT id INTO v_d_d3 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'D338-CAP';
    SELECT id INTO v_d_d4 FROM framework_domains WHERE framework_id = v_fw_id AND code = 'D338-INC';

    -- ── Dominio 1: Gobernanza ─────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_d1, 'D338-GOB-1', 'Marco Institucional de Seguridad Digital',
         'Las entidades del Estado colombiano deben establecer un marco institucional de seguridad digital que incluya políticas, responsabilidades, roles y recursos alineados con los lineamientos del Gobierno Digital y el MSPI (Modelo de Seguridad y Privacidad de la Información).',
         TRUE, 10, now()),
        (v_fw_id, v_d_d1, 'D338-GOB-2', 'Designación del Oficial de Seguridad Digital',
         'Las entidades deben designar formalmente un responsable o equipo de seguridad digital (equivalente al CISO) con autoridad, recursos y capacidades suficientes para liderar la gestión de seguridad digital de la entidad.',
         TRUE, 20, now()),
        (v_fw_id, v_d_d1, 'D338-GOB-3', 'Política de Seguridad Digital Institucional',
         'Las entidades deben formular, aprobar, publicar y revisar periódicamente una política de seguridad digital institucional alineada con el Marco de Referencia de Arquitectura Empresarial del Estado colombiano y el MSPI.',
         TRUE, 30, now()),
        (v_fw_id, v_d_d1, 'D338-GOB-4', 'Plan Estratégico de Seguridad Digital',
         'Las entidades deben elaborar un plan estratégico de seguridad digital con objetivos, metas, indicadores, cronograma y presupuesto definidos, articulado con el Plan Institucional de Archivos y el plan de acción TI.',
         TRUE, 40, now()),
        (v_fw_id, v_d_d1, 'D338-GOB-5', 'Concienciación y Formación en Seguridad Digital',
         'Las entidades deben implementar programas de concienciación y formación en seguridad digital dirigidos a todos sus servidores públicos, contratistas y usuarios con acceso a los sistemas de información.',
         TRUE, 50, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Dominio 2: Gestión de Riesgos ────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_d2, 'D338-GR-1', 'Metodología de Gestión de Riesgos de Seguridad Digital',
         'Las entidades deben adoptar e implementar una metodología de gestión de riesgos de seguridad digital alineada con el Sistema de Administración de Riesgo Institucional (MIPG) y las guías del Ministerio de Tecnologías de la Información y las Comunicaciones (MinTIC).',
         TRUE, 10, now()),
        (v_fw_id, v_d_d2, 'D338-GR-2', 'Identificación y Valoración de Activos de Información',
         'Las entidades deben identificar, clasificar y valorar los activos de información críticos, determinando su nivel de criticidad según su impacto en la confidencialidad, integridad y disponibilidad.',
         TRUE, 20, now()),
        (v_fw_id, v_d_d2, 'D338-GR-3', 'Análisis y Evaluación de Riesgos de Seguridad Digital',
         'Las entidades deben realizar análisis periódicos de riesgos de seguridad digital que incluyan la identificación de amenazas, vulnerabilidades, probabilidad de ocurrencia e impacto, generando el mapa de riesgos de seguridad digital.',
         TRUE, 30, now()),
        (v_fw_id, v_d_d2, 'D338-GR-4', 'Tratamiento de Riesgos de Seguridad Digital',
         'Las entidades deben definir e implementar planes de tratamiento de riesgos con las medidas de seguridad seleccionadas (mitigar, aceptar, transferir o evitar) conforme a los criterios de aceptación de riesgo institucional.',
         TRUE, 40, now()),
        (v_fw_id, v_d_d2, 'D338-GR-5', 'Monitoreo y Revisión de Riesgos',
         'Las entidades deben monitorear y revisar periódicamente los riesgos de seguridad digital, sus tratamientos y la efectividad de los controles implementados, reportando los resultados a la alta dirección.',
         TRUE, 50, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Dominio 3: Capacidades ────────────────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_d3, 'D338-CAP-1', 'Implementación de Controles de Seguridad Digital',
         'Las entidades deben implementar controles de seguridad digital técnicos, administrativos y físicos basados en los resultados de la gestión de riesgos, las guías y estándares del MinTIC y el MSPI (controles mínimos obligatorios).',
         TRUE, 10, now()),
        (v_fw_id, v_d_d3, 'D338-CAP-2', 'Seguridad en el Ciclo de Vida de los Sistemas de Información',
         'Las entidades deben incorporar requisitos y prácticas de seguridad digital a lo largo del ciclo de vida de sus sistemas de información, desde el diseño, desarrollo, pruebas, implementación, operación hasta el retiro.',
         TRUE, 20, now()),
        (v_fw_id, v_d_d3, 'D338-CAP-3', 'Continuidad de los Servicios Digitales',
         'Las entidades deben establecer e implementar planes de continuidad de los servicios digitales críticos, incluyendo planes de recuperación ante desastres (DRP) y planes de continuidad del negocio (BCP) para los sistemas de información esenciales.',
         TRUE, 30, now()),
        (v_fw_id, v_d_d3, 'D338-CAP-4', 'Gestión de Identidad y Acceso',
         'Las entidades deben implementar mecanismos de autenticación fuerte y gestión de identidades para el acceso a sus sistemas de información, incluyendo el principio de mínimo privilegio y la autenticación multifactor para accesos privilegiados.',
         TRUE, 40, now()),
        (v_fw_id, v_d_d3, 'D338-CAP-5', 'Seguridad en la Infraestructura Tecnológica',
         'Las entidades deben implementar controles de seguridad en su infraestructura tecnológica (redes, servidores, endpoints, nube) incluyendo segmentación de redes, gestión de parches, protección contra malware y monitoreo continuo.',
         TRUE, 50, now()),
        (v_fw_id, v_d_d3, 'D338-CAP-6', 'Protección de Datos Personales en el Entorno Digital',
         'Las entidades deben implementar medidas específicas de protección de datos personales en sus sistemas de información, alineadas con la Ley 1581 de 2012, el Decreto 1074 de 2015 y la Política Nacional de Seguridad Digital.',
         TRUE, 60, now()),
        (v_fw_id, v_d_d3, 'D338-CAP-7', 'Auditoría y Evaluación de Conformidad',
         'Las entidades deben realizar auditorías periódicas de seguridad digital (internas y externas) para evaluar el nivel de conformidad con los lineamientos del Decreto 338 de 2022, el MSPI y los estándares nacionales e internacionales aplicables.',
         TRUE, 70, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

    -- ── Dominio 4: Gestión de Incidentes ─────────────
    INSERT INTO framework_requirements (framework_id, domain_id, code, name, description, is_mandatory, sort_order, created_at)
    VALUES
        (v_fw_id, v_d_d4, 'D338-INC-1', 'Plan de Respuesta a Incidentes de Seguridad Digital',
         'Las entidades deben elaborar, implementar, probar y mantener actualizado un plan de respuesta a incidentes de seguridad digital que defina los procedimientos, roles, responsabilidades y canales de comunicación ante un ciberincidente.',
         TRUE, 10, now()),
        (v_fw_id, v_d_d4, 'D338-INC-2', 'Reporte de Incidentes al ColCERT / CSIRT',
         'Las entidades deben reportar los incidentes de seguridad digital significativos al Grupo de Respuesta a Emergencias Cibernéticas de Colombia (ColCERT) y al CSIRT Gobierno en los tiempos y formatos establecidos por las directrices del MinTIC.',
         TRUE, 20, now()),
        (v_fw_id, v_d_d4, 'D338-INC-3', 'Análisis Forense Digital y Preservación de Evidencias',
         'Las entidades deben implementar capacidades de análisis forense digital para investigar los incidentes de seguridad, preservar las evidencias digitales con cadena de custodia y generar lecciones aprendidas para fortalecer los controles existentes.',
         TRUE, 30, now()),
        (v_fw_id, v_d_d4, 'D338-INC-4', 'Monitoreo Continuo y Detección de Amenazas',
         'Las entidades deben implementar capacidades de monitoreo continuo de seguridad, incluyendo la correlación de eventos, detección de anomalías y alertas tempranas, articuladas con las plataformas del Centro Cibernético Policial y el ColCERT.',
         TRUE, 40, now()),
        (v_fw_id, v_d_d4, 'D338-INC-5', 'Ejercicios de Ciberseguridad y Gestión de Crisis',
         'Las entidades deben realizar ejercicios periódicos de respuesta a incidentes (tabletop exercises, simulacros) y ejercicios de gestión de crisis cibernética para probar y mejorar sus capacidades de respuesta y recuperación.',
         TRUE, 50, now())
    ON CONFLICT (framework_id, code) DO NOTHING;

END $$;

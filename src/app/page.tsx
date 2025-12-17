import Link from 'next/link'
import { ArrowRight, BarChart3, FileText, CreditCard, Shield, Zap, Globe } from 'lucide-react'

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 opacity-90">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                </div>

                {/* Content */}
                <div className="relative container mx-auto px-6 py-24 md:py-32">
                    <div className="flex flex-col items-center text-center text-white">
                        {/* Logo/Brand */}
                        <div className="mb-8 animate-bounce-subtle">
                            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-lg rounded-full border border-white/30">
                                <Zap className="w-5 h-5" />
                                <span className="font-bold text-sm">Sistema Multi-Empresa</span>
                            </div>
                        </div>

                        {/* Main heading */}
                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-fade-in">
                            NOVA-ADM
                        </h1>

                        <p className="text-xl md:text-2xl mb-4 max-w-3xl font-light animate-slide-in">
                            Sistema Administrativo Integral para Venezuela
                        </p>

                        <p className="text-lg md:text-xl mb-12 max-w-2xl opacity-90">
                            Gestiona tu empresa con eficiencia: Caja, Facturación, Libros Contables, Retenciones y más
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 animate-in">
                            <Link
                                href="/dashboard"
                                className="btn-gradient px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 group"
                            >
                                Ver Demo
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="/auth/login"
                                className="px-8 py-4 rounded-xl text-lg font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/30 transition-all duration-300 flex items-center gap-2"
                            >
                                Iniciar Sesión
                            </Link>

                            <Link
                                href="/auth/register"
                                className="px-8 py-4 rounded-xl text-lg font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 transition-all duration-300 flex items-center gap-2"
                            >
                                Registrar Empresa
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Wave separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" className="text-gray-50 dark:text-gray-900" />
                    </svg>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient">
                            Todo lo que necesitas
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Cumplimiento total con normativas venezolanas (SENIAT, Alcaldías)
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="card-interactive p-8"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-6 shadow-glow">
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>

                                <h3 className="text-xl font-display font-semibold mb-3">
                                    {feature.title}
                                </h3>

                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {feature.description}
                                </p>

                                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
                                    {feature.items.map((item, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="container mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                                Diseñado para <span className="text-gradient">Venezuela</span>
                            </h2>

                            <div className="space-y-6">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                            <benefit.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                                            <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="glass-card p-8 rounded-2xl">
                                <div className="space-y-4">
                                    <div className="h-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full w-3/4"></div>
                                    <div className="h-3 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-full w-1/2"></div>
                                    <div className="h-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full w-5/6"></div>

                                    <div className="grid grid-cols-2 gap-4 pt-6">
                                        <div className="metric-card">
                                            <div className="text-3xl font-bold text-gradient mb-1">100%</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Cumplimiento Legal</div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="text-3xl font-bold text-gradient mb-1">24/7</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Acceso Online</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary-500/20 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="container mx-auto">
                    <div className="glass-card rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10"></div>

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                                ¿Listo para optimizar tu gestión?
                            </h2>

                            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                                Únete a empresas que ya confían en NOVA-ADM para su administración
                            </p>

                            <Link
                                href="/auth/register"
                                className="btn-gradient px-10 py-5 rounded-xl text-lg font-semibold inline-flex items-center gap-2 group"
                            >
                                Comenzar Ahora
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-6">
                <div className="container mx-auto text-center">
                    <div className="mb-6">
                        <h3 className="text-2xl font-display font-bold mb-2">NOVA-ADM</h3>
                        <p className="text-gray-400">Sistema Administrativo Integral</p>
                    </div>

                    <div className="text-gray-500 text-sm">
                        © 2024 NOVA-ADM. Hecho para Venezuela 🇻🇪
                    </div>
                </div>
            </footer>
        </div>
    )
}

const features = [
    {
        icon: CreditCard,
        title: 'Caja y Pagos',
        description: 'Control total de efectivo y transacciones',
        items: ['Apertura y cierre de caja', 'Conciliación automática', 'Múltiples métodos de pago']
    },
    {
        icon: FileText,
        title: 'Libros Contables',
        description: 'Compras y ventas organizadas',
        items: ['Libro de ventas', 'Libro de compras', 'Reportes automáticos']
    },
    {
        icon: Shield,
        title: 'Retenciones Fiscales',
        description: 'Cumplimiento con SENIAT',
        items: ['Retenciones de IVA', 'Retenciones de ISLR', 'Retenciones municipales']
    },
    {
        icon: BarChart3,
        title: 'Cuentas por Cobrar/Pagar',
        description: 'Gestión de cartera completa',
        items: ['Antigüedad de saldos', 'Recordatorios de pago', 'Proyecciones de flujo']
    },
    {
        icon: FileText,
        title: 'Exportación TXT/XML',
        description: 'Archivos para entes gubernamentales',
        items: ['Formato SENIAT', 'Validación automática', 'Comprobantes digitales']
    },
    {
        icon: Globe,
        title: 'Multi-Empresa',
        description: 'Gestiona múltiples negocios',
        items: ['Empresas ilimitadas', 'Datos aislados', 'Reportes consolidados']
    },
]

const benefits = [
    {
        icon: Zap,
        title: 'Rápido y Eficiente',
        description: 'Interfaz intuitiva diseñada para agilizar tus procesos diarios'
    },
    {
        icon: Shield,
        title: 'Seguro y Confiable',
        description: 'Tus datos protegidos con los más altos estándares de seguridad'
    },
    {
        icon: Globe,
        title: 'Acceso desde Cualquier Lugar',
        description: 'Disponible en web y móvil. Trabaja desde donde estés'
    },
]

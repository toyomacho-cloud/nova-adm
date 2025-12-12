'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Building, User, Phone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        companyName: '',
        rif: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        if (formData.password !== formData.confirmPassword) {
            alert('Las contraseñas no coinciden')
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    companyName: formData.companyName,
                    rif: formData.rif,
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar')
            }

            // Success
            alert('¡Registro exitoso! Ahora puedes iniciar sesión.')
            window.location.href = '/auth/login'

        } catch (error) {
            console.error(error)
            alert(error instanceof Error ? error.message : 'Error al registrar empresa')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-primary-500/10">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            </div>

            {/* Floating shapes */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse-soft"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>

            <Card variant="glass" className="w-full max-w-2xl relative z-10 animate-in">
                <div className="text-center mb-8">
                    {/* Logo */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 mb-4 shadow-glow">
                        <Building className="w-8 h-8 text-white" />
                    </div>

                    <h1 className="text-3xl font-display font-bold mb-2 text-gradient">
                        Registrar Empresa
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Comienza a gestionar tu negocio hoy
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre de la Empresa"
                            name="companyName"
                            placeholder="Mi Empresa C.A."
                            value={formData.companyName}
                            onChange={handleChange}
                            icon={<Building className="w-5 h-5" />}
                            required
                        />

                        <Input
                            label="RIF"
                            name="rif"
                            placeholder="J-12345678-9"
                            value={formData.rif}
                            onChange={handleChange}
                            icon={<Building className="w-5 h-5" />}
                            required
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre del Administrador"
                            name="name"
                            placeholder="Juan Pérez"
                            value={formData.name}
                            onChange={handleChange}
                            icon={<User className="w-5 h-5" />}
                            required
                        />

                        <Input
                            label="Teléfono"
                            name="phone"
                            type="tel"
                            placeholder="0414-1234567"
                            value={formData.phone}
                            onChange={handleChange}
                            icon={<Phone className="w-5 h-5" />}
                        />
                    </div>

                    <Input
                        label="Correo Electrónico"
                        name="email"
                        type="email"
                        placeholder="admin@empresa.com"
                        value={formData.email}
                        onChange={handleChange}
                        icon={<Mail className="w-5 h-5" />}
                        required
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            label="Contraseña"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            icon={<Lock className="w-5 h-5" />}
                            required
                        />

                        <Input
                            label="Confirmar Contraseña"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            icon={<Lock className="w-5 h-5" />}
                            required
                        />
                    </div>

                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            className="w-4 h-4 mt-1 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                            required
                        />
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                            Acepto los{' '}
                            <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                                Términos y Condiciones
                            </Link>
                            {' '}y la{' '}
                            <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                                Política de Privacidad
                            </Link>
                        </label>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full group"
                        isLoading={isLoading}
                    >
                        Crear Cuenta
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                            Iniciar Sesión
                        </Link>
                    </p>
                </div>
            </Card>

            <Link
                href="/"
                className="absolute top-6 left-6 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors font-medium"
            >
                ← Volver al inicio
            </Link>
        </div>
    )
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from './components/handlers/UserContext';
import { AlertTriangle } from 'lucide-react';

export default function EmergencyLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { setEmergencyAccess } = useUser();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Check emergency credentials against environment variables
        if (username === import.meta.env.VITE_EMERGENCY_ADMIN_USERNAME && 
            password === import.meta.env.VITE_EMERGENCY_ADMIN_PASSWORD) {
            setEmergencyAccess(true);
            navigate('/'); // Redirect to home page
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-100 z-50">
            <Card className="w-[400px] mx-auto">
                <CardHeader>
                    <CardTitle className="text-center text-red-600">Emergency Access</CardTitle>
                    <CardDescription className="text-center">
                        <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Warning: All actions will be logged</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            This login will be recorded as "EmergencyAdminLogin" in all system logs.
                            Use only in case of emergency.
                        </p>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && (
                            <div className="text-red-600 text-sm text-center">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 
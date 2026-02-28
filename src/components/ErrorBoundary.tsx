import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen flex items-center justify-center bg-background px-4">
                    <Card className="max-w-md w-full">
                        <CardContent className="pt-6 text-center space-y-4">
                            <div className="h-12 w-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Something went wrong</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    An unexpected error occurred. Your data is safe.
                                </p>
                            </div>
                            {this.state.error && (
                                <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32 text-left text-muted-foreground">
                                    {this.state.error.message}
                                </pre>
                            )}
                            <div className="flex gap-2 justify-center">
                                <Button variant="outline" size="sm" onClick={this.handleReset}>
                                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                    Try Again
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        this.handleReset();
                                        window.location.href = "/";
                                    }}
                                >
                                    Go Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, LineChart, Package, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import apiService from '../services/api';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Legend, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function AdminReportsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));
  const months = [
    { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    loadReports();
  }, [navigate, selectedYear, selectedMonth]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSalesReport({
        year: selectedYear,
        month: selectedMonth,
      });
      setReportData(data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os relatórios de vendas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => apiService.formatPrice(value);

  const dailySalesChartData = reportData?.monthly_stats?.daily_sales.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: day.total,
  })) || [];

  const productSalesChartData = reportData?.product_stats.map(product => ({
    name: product.product_name,
    quantity: product.total_quantity,
    revenue: product.total_revenue,
  })) || [];

  const categorySalesChartData = reportData?.category_stats.map(category => ({
    name: category.category,
    revenue: category.total_revenue,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Relatórios de Vendas</h1>
        <p className="text-muted-foreground">
          Análise detalhada das vendas e desempenho da geladeira inteligente
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
          <CardDescription>Selecione o período para gerar os relatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      ) : reportData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resumo Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Mensal</CardTitle>
              <CardDescription>Vendas totais e número de transações no período.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total de Vendas</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(reportData.monthly_stats.total_sales)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total de Transações</span>
                <span className="text-2xl font-bold">
                  {reportData.monthly_stats.total_transactions}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Vendas Diárias */}
          <Card>
            <CardHeader>
              <CardTitle>Vendas Diárias</CardTitle>
              <CardDescription>Total de vendas por dia no mês selecionado.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={dailySalesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vendas por Produto */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Vendas por Produto</CardTitle>
              <CardDescription>Quantidade e receita por produto.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Quantidade Vendida</TableHead>
                    <TableHead className="text-right">Receita Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.product_stats.length > 0 ? (
                    reportData.product_stats.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.product_name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.total_quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.total_revenue)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma venda de produto neste período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Vendas por Categoria */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Vendas por Categoria</CardTitle>
              <CardDescription>Receita total por categoria de produto.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={categorySalesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Receita" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um ano e mês para visualizar os relatórios.</p>
        </div>
      )}
    </div>
  );
}

export default AdminReportsPage;

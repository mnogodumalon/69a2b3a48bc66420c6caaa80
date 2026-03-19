import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import MedikamentenplanPage from '@/pages/MedikamentenplanPage';
import KlientenstammdatenPage from '@/pages/KlientenstammdatenPage';
import WunddokumentationPage from '@/pages/WunddokumentationPage';
import VitalwerteErfassungPage from '@/pages/VitalwerteErfassungPage';
import TourenplanungPage from '@/pages/TourenplanungPage';
import PflegeplanungPage from '@/pages/PflegeplanungPage';
import LeistungsnachweisPage from '@/pages/LeistungsnachweisPage';
import PflegedurchfuehrungPage from '@/pages/PflegedurchfuehrungPage';
import PflegefachkraeftePage from '@/pages/PflegefachkraeftePage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="medikamentenplan" element={<MedikamentenplanPage />} />
          <Route path="klientenstammdaten" element={<KlientenstammdatenPage />} />
          <Route path="wunddokumentation" element={<WunddokumentationPage />} />
          <Route path="vitalwerte-erfassung" element={<VitalwerteErfassungPage />} />
          <Route path="tourenplanung" element={<TourenplanungPage />} />
          <Route path="pflegeplanung" element={<PflegeplanungPage />} />
          <Route path="leistungsnachweis" element={<LeistungsnachweisPage />} />
          <Route path="pflegedurchfuehrung" element={<PflegedurchfuehrungPage />} />
          <Route path="pflegefachkraefte" element={<PflegefachkraeftePage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
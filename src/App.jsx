
import React, { useState, useEffect } from 'react';

// --- RBAC Configuration ---
const ROLES = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    USER: 'User',
};

// --- Sample Data Generator ---
const generateSampleData = (count = 10) => {
    const statuses = ['Approved', 'In Progress', 'Pending', 'Rejected', 'Exception'];
    const projectNames = ['Project Phoenix', 'Operation Eagle', 'Apollo Initiative', 'Gemini Mission', 'Orion Program', 'Venture Capital Fund', 'Client X Onboarding', 'Q4 Marketing Blitz', 'Product Launch Alpha', 'Infrastructure Upgrade'];
    const users = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

    const records = Array.from({ length: count }, (_, i) => {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60) - 30); // +/- 30 days
        const startDate = new Date(dueDate);
        startDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 90) - 30);
        const approvedBy = status === 'Approved' ? users[Math.floor(Math.random() * users.length)] : null;
        const assignedTo = users[Math.floor(Math.random() * users.length)];

        return {
            id: `REC-${String(i + 1).padStart(3, '0')}`,
            name: projectNames[i % projectNames.length] + (i >= projectNames.length ? ` (${i + 1})` : ''),
            status: status,
            description: `This is a detailed description for ${projectNames[i % projectNames.length]}. It outlines the scope, objectives, and expected outcomes of the project.`,
            startDate: startDate.toLocaleDateString(),
            dueDate: dueDate.toLocaleDateString(),
            budget: (Math.random() * 100000 + 10000).toFixed(2),
            progress: Math.floor(Math.random() * 100),
            assignedTo: assignedTo,
            approvedBy: approvedBy,
            milestones: [
                { id: 1, name: 'Initiation', status: 'completed', date: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(), slaStatus: 'Met' },
                { id: 2, name: 'Planning', status: status === 'Approved' || status === 'In Progress' ? 'completed' : 'pending', date: status === 'Approved' || status === 'In Progress' ? new Date(startDate.getTime() + 20 * 24 * 60 * 60 * 1000).toLocaleDateString() : null, slaStatus: Math.random() > 0.8 ? 'Breached' : 'Met' },
                { id: 3, name: 'Execution', status: status === 'Approved' ? 'completed' : (status === 'In Progress' ? 'in-progress' : 'pending'), date: status === 'Approved' ? new Date(startDate.getTime() + 45 * 24 * 60 * 60 * 1000).toLocaleDateString() : null, slaStatus: Math.random() > 0.9 ? 'Breached' : 'Met' },
                { id: 4, name: 'Review', status: status === 'Approved' ? 'in-progress' : 'pending', date: null, slaStatus: 'Not Applicable' },
                { id: 5, name: 'Completion', status: 'pending', date: null, slaStatus: 'Not Applicable' },
            ].map(m => ({ ...m, slaBreached: m.slaStatus === 'Breached' })),
            auditLog: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, k) => ({
                id: `AUD-${i}-${k}`,
                timestamp: new Date(startDate.getTime() + k * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
                user: users[Math.floor(Math.random() * users.length)],
                action: k === 0 ? 'Record Created' : (k === 1 ? 'Status Updated' : 'Comment Added'),
                details: k === 0 ? 'Initial record creation.' : (k === 1 ? `Status changed to ${status}.` : `User ${users[Math.floor(Math.random() * users.length)]} added a note.`),
            })),
            relatedRecords: Array.from({ length: Math.floor(Math.random() * 3) }, (_, k) => ({
                id: `REL-${i}-${k}`,
                name: `Related Task ${k + 1}`,
                status: statuses[Math.floor(Math.random() * statuses.length)],
            })),
            documents: [
                { name: 'Project Brief.pdf', url: '#', type: 'pdf' },
                { name: 'Budget Plan.xlsx', url: '#', type: 'excel' },
            ],
        };
    });

    const kpis = {
        totalRecords: records.length,
        approved: records.filter(r => r.status === 'Approved').length,
        inProgress: records.filter(r => r.status === 'In Progress').length,
        pending: records.filter(r => r.status === 'Pending').length,
        rejected: records.filter(r => r.status === 'Rejected').length,
    };

    return { records, kpis };
};

// --- Reusable Components ---

const StatusBadge = ({ status }) => {
    const statusClass = status.toLowerCase().replace(/\s/g, '-');
    return (
        <span className={`status-badge status-${statusClass}`}>
            {status}
        </span>
    );
};

const Card = ({ record, onClick, currentUserRole }) => {
    const statusColorClass = record.status.toLowerCase().replace(/\s/g, '-');
    // RBAC: Only show Edit button for Admins/Managers on In Progress/Pending records
    const canEdit = (currentUserRole === ROLES.ADMIN || currentUserRole === ROLES.MANAGER) &&
                    (record.status === 'In Progress' || record.status === 'Pending');

    return (
        <div className="card" onClick={() => onClick(record?.id, 'RECORD_DETAIL')}>
            <div className={`card-status-border status-${statusColorClass}`} style={{ backgroundColor: `var(--status-${statusColorClass}-border)` }}></div>
            <h4 className="card-title">{record?.name}</h4>
            <p className="card-subtitle">{record?.description?.substring(0, 70)}...</p>
            <div className="card-meta">
                <StatusBadge status={record?.status} />
                <span>Due: {record?.dueDate}</span>
            </div>
            {canEdit && (
                <div style={{ marginTop: 'var(--spacing-sm)', textAlign: 'right' }}>
                    <button
                        className="button button-secondary"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            onClick(record?.id, 'EDIT_FORM');
                        }}
                    >
                        📝 Edit
                    </button>
                </div>
            )}
        </div>
    );
};

const Header = ({ onSearch, onLogoClick }) => {
    return (
        <header className="app-header">
            <div className="app-logo" onClick={onLogoClick}>
                Untitled Project
            </div>
            <div className="global-search">
                <span className="global-search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Global search..."
                    className="global-search-input"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
            <div className="user-profile">
                <button className="button button-icon">⚙️</button>
                <div className="user-avatar">AD</div>
            </div>
        </header>
    );
};

const Breadcrumbs = ({ path, onNavigate }) => {
    return (
        <nav className="breadcrumbs">
            <span className="breadcrumb-item">
                <a href="#" onClick={() => onNavigate({ screen: 'DASHBOARD' })}>Home</a>
            </span>
            {path.map((item, index) => (
                <React.Fragment key={index}>
                    <span className="breadcrumb-separator">/</span>
                    <span className={`breadcrumb-item ${index === path.length - 1 ? 'active' : ''}`}>
                        {item.onClick ? <a href="#" onClick={() => onNavigate(item.target)}>{item.label}</a> : item.label}
                    </span>
                </React.Fragment>
            ))}
        </nav>
    );
};

const MilestoneTracker = ({ milestones }) => {
    if (!milestones || milestones.length === 0) return null;

    return (
        <div className="record-sidebar-panel">
            <h3>Milestone Tracker</h3>
            <ul className="milestone-tracker">
                {milestones.map((milestone) => (
                    <li key={milestone?.id} className={`milestone-item ${milestone?.status}`}>
                        <h4>{milestone?.name} {milestone?.slaBreached && <span style={{ color: 'var(--status-rejected-border)', fontSize: '0.8rem' }}> (SLA Breached!)</span>}</h4>
                        <p>{milestone?.status === 'completed' ? `Completed on ${milestone?.date}` : 'Pending'}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const AuditFeed = ({ logs, currentUserRole }) => {
    // RBAC: Only show audit logs for Admin/Manager
    if (currentUserRole !== ROLES.ADMIN && currentUserRole !== ROLES.MANAGER) return null;

    if (!logs || logs.length === 0) return null;

    return (
        <div className="record-sidebar-panel">
            <h3>News / Audit Feed</h3>
            <div className="audit-feed">
                {logs.map((log) => (
                    <div key={log?.id} className="audit-feed-item">
                        <span className="audit-feed-icon">📄</span>
                        <div className="audit-feed-content">
                            <p><strong>{log?.user}</strong> {log?.action}</p>
                            <p>{log?.details}</p>
                            <span>{log?.timestamp}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ChartPlaceholder = ({ title, type }) => (
    <div className="card" style={{ cursor: 'default' }}>
        <h4 className="card-title">{title}</h4>
        <p style={{ color: 'var(--text-secondary)' }}><em>{type} Chart Placeholder - AI Insights Here</em></p>
        <div style={{ height: '150px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            📊 {type} Visualization
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)' }}>
            Trend: +{Math.floor(Math.random() * 10)}% last month 📈
        </div>
    </div>
);

const EmptyState = ({ title, message, actionText, onAction }) => (
    <div className="empty-state">
        <div className="empty-state-icon">📂</div>
        <h3>{title}</h3>
        <p>{message}</p>
        {onAction && (
            <button className="button button-primary" onClick={onAction}>{actionText}</button>
        )}
    </div>
);

// --- Main Application Component ---
function App() {
    const [view, setView] = useState({ screen: 'DASHBOARD', params: {} });
    const [records, setRecords] = useState([]);
    const [kpis, setKpis] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUserRole, setCurrentUserRole] = useState(ROLES.ADMIN); // Default role

    useEffect(() => {
        const { records: generatedRecords, kpis: generatedKpis } = generateSampleData();
        setRecords(generatedRecords);
        setKpis(generatedKpis);

        // Simulate real-time updates for KPIs
        const interval = setInterval(() => {
            setKpis(prevKpis => ({
                ...prevKpis,
                inProgress: prevKpis.inProgress + (Math.random() > 0.5 ? 1 : -1) // Example dynamic update
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCardClick = (id, screen) => {
        setView({ screen, params: { id } });
    };

    const handleBack = () => {
        if (view.screen === 'RECORD_DETAIL' || view.screen === 'EDIT_FORM') {
            setView({ screen: 'RECORD_LIST' });
        } else {
            setView({ screen: 'DASHBOARD' });
        }
    };

    const handleLogoClick = () => {
        setView({ screen: 'DASHBOARD' });
    };

    const handleGlobalSearch = (term) => {
        setSearchTerm(term);
        if (term.length > 2 && view.screen !== 'RECORD_LIST') {
            setView({ screen: 'RECORD_LIST', params: { searchTerm: term } });
        } else if (term.length === 0 && view.screen === 'RECORD_LIST' && view.params?.searchTerm) {
            setView({ screen: 'DASHBOARD' }); // Or clear search results
        }
    };

    const handleSaveRecord = (updatedRecord) => {
        setRecords(prevRecords => prevRecords.map(rec =>
            rec.id === updatedRecord.id ? { ...rec, ...updatedRecord } : rec
        ));
        setView({ screen: 'RECORD_DETAIL', params: { id: updatedRecord.id } });
    };

    const getBreadcrumbs = () => {
        const breadcrumbPath = [{ label: 'Home', target: { screen: 'DASHBOARD' }, onClick: true }];
        if (view.screen === 'RECORD_LIST') {
            breadcrumbPath.push({ label: 'Records', target: { screen: 'RECORD_LIST' }, onClick: false });
        } else if (view.screen === 'RECORD_DETAIL' && view.params.id) {
            const record = records.find(r => r.id === view.params.id);
            breadcrumbPath.push({ label: 'Records', target: { screen: 'RECORD_LIST' }, onClick: true });
            breadcrumbPath.push({ label: record?.name || 'Detail', target: { screen: 'RECORD_DETAIL', params: { id: record?.id } }, onClick: false });
        } else if (view.screen === 'EDIT_FORM' && view.params.id) {
            const record = records.find(r => r.id === view.params.id);
            breadcrumbPath.push({ label: 'Records', target: { screen: 'RECORD_LIST' }, onClick: true });
            breadcrumbPath.push({ label: record?.name || 'Detail', target: { screen: 'RECORD_DETAIL', params: { id: record?.id } }, onClick: true });
            breadcrumbPath.push({ label: 'Edit', target: { screen: 'EDIT_FORM', params: { id: record?.id } }, onClick: false });
        }
        return breadcrumbPath;
    };

    const filteredRecords = records.filter(record =>
        record?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record?.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderScreen = () => {
        switch (view.screen) {
            case 'DASHBOARD':
                return (
                    <div className="container">
                        <h2>Dashboard</h2>
                        <p style={{marginBottom: 'var(--spacing-lg)'}}>Real-time overview of key performance indicators and recent activities.</p>

                        {/* KPIs */}
                        <div className="dashboard-kpis">
                            <div className="kpi-card">
                                <span className="kpi-label">Total Records</span>
                                <div className="kpi-value">{kpis.totalRecords}</div>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Approved</span>
                                <div className="kpi-value" style={{color: 'var(--status-approved-border)'}}>{kpis.approved}</div>
                            </div>
                            <div className="kpi-card kpi-realtime pulse">
                                <span className="kpi-label">In Progress</span>
                                <div className="kpi-value" style={{color: 'var(--status-in-progress-border)'}}>{kpis.inProgress}</div>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Pending</span>
                                <div className="kpi-value" style={{color: 'var(--status-pending-border)'}}>{kpis.pending}</div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <h3 style={{marginTop: 'var(--spacing-xl)'}}>Performance Metrics</h3>
                        <div className="card-grid">
                            <ChartPlaceholder title="Monthly Progress" type="Line" />
                            <ChartPlaceholder title="Status Distribution" type="Donut" />
                            <ChartPlaceholder title="SLA Compliance" type="Gauge" />
                            <ChartPlaceholder title="Budget Utilization" type="Bar" />
                        </div>

                        {/* Recent Records */}
                        <h3 style={{marginTop: 'var(--spacing-xl)'}}>Recent Activities</h3>
                        <div className="card-grid">
                            {records.slice(0, 4).map(record => (
                                <Card key={record.id} record={record} onClick={handleCardClick} currentUserRole={currentUserRole} />
                            ))}
                            {records.length === 0 && (
                                <EmptyState
                                    title="No Recent Records"
                                    message="It looks like there are no recent activities. Start by creating a new record!"
                                    actionText="Create New Record"
                                    onAction={() => alert('Navigate to New Record Form')}
                                />
                            )}
                        </div>

                        <div style={{textAlign: 'right', marginTop: 'var(--spacing-lg)'}}>
                            <button className="button button-primary" onClick={() => setView({ screen: 'RECORD_LIST' })}>View All Records →</button>
                        </div>
                    </div>
                );

            case 'RECORD_LIST':
                const recordsToDisplay = searchTerm ? filteredRecords : records;
                return (
                    <div className="container">
                        <Breadcrumbs path={getBreadcrumbs()} onNavigate={setView} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2>All Records</h2>
                            <div className="flex gap-md">
                                {/* RBAC: Only Admin/Manager can perform bulk actions or create */}
                                {(currentUserRole === ROLES.ADMIN || currentUserRole === ROLES.MANAGER) && (
                                    <>
                                        <button className="button button-secondary">📊 Export (PDF/Excel)</button>
                                        <button className="button button-primary">➕ New Record</button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-md)' }}>
                            {/* Filter and Sort placeholders */}
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="form-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ flexGrow: 1 }}
                            />
                            <button className="button button-secondary">⚙️ Filters</button>
                            <button className="button button-secondary">↕️ Sort</button>
                            <button className="button button-secondary">💾 Saved Views</button>
                        </div>
                        {recordsToDisplay.length > 0 ? (
                            <div className="card-grid">
                                {recordsToDisplay.map(record => (
                                    <Card key={record.id} record={record} onClick={handleCardClick} currentUserRole={currentUserRole} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No Records Found"
                                message={searchTerm ? `No records match "${searchTerm}". Try a different search term.` : "It looks like there are no records yet. Click 'New Record' to add one."}
                                actionText={searchTerm ? "Clear Search" : "Create New Record"}
                                onAction={searchTerm ? () => setSearchTerm('') : () => alert('Navigate to New Record Form')}
                            />
                        )}
                        {(currentUserRole === ROLES.ADMIN || currentUserRole === ROLES.MANAGER) && recordsToDisplay.length > 0 && (
                            <div style={{textAlign: 'center', marginTop: 'var(--spacing-lg)'}}>
                                <button className="button button-secondary">✅ Perform Bulk Action</button>
                            </div>
                        )}
                    </div>
                );

            case 'RECORD_DETAIL':
                const record = records.find(r => r.id === view.params.id);
                if (!record) {
                    return <div className="container"><p>Record not found.</p></div>;
                }
                return (
                    <div className="container">
                        <Breadcrumbs path={getBreadcrumbs()} onNavigate={setView} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2>{record?.name} <StatusBadge status={record?.status} /></h2>
                            <div className="flex gap-md">
                                <button className="button button-secondary" onClick={handleBack}>← Back to List</button>
                                {/* RBAC: Only Admin/Manager can edit */}
                                {(currentUserRole === ROLES.ADMIN || currentUserRole === ROLES.MANAGER) && (
                                    <button className="button button-primary" onClick={() => setView({ screen: 'EDIT_FORM', params: { id: record.id } })}>📝 Edit Record</button>
                                )}
                            </div>
                        </div>

                        <div className="record-detail-layout">
                            <div className="record-main-content">
                                <div className="record-summary-panel">
                                    <h3>Record Summary</h3>
                                    <div className="record-summary-details">
                                        <p><strong>Description:</strong> {record?.description}</p>
                                        <p><strong>Assigned To:</strong> {record?.assignedTo}</p>
                                        <p><strong>Start Date:</strong> {record?.startDate}</p>
                                        <p><strong>Due Date:</strong> {record?.dueDate}</p>
                                        <p><strong>Budget:</strong> ${record?.budget}</p>
                                        <p><strong>Progress:</strong> {record?.progress}%</p>
                                        {record?.approvedBy && <p><strong>Approved By:</strong> {record?.approvedBy}</p>}
                                    </div>
                                    <h4 style={{marginTop: 'var(--spacing-lg)'}}>Related Records</h4>
                                    {record?.relatedRecords?.length > 0 ? (
                                        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                                            {record?.relatedRecords.map(rel => (
                                                <div key={rel?.id} className="card" onClick={() => handleCardClick(rel?.id, 'RECORD_DETAIL')} style={{padding: 'var(--spacing-md)'}}>
                                                    <h5 className="card-title">{rel?.name}</h5>
                                                    <StatusBadge status={rel?.status} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No related records.</p>
                                    )}
                                    <h4 style={{marginTop: 'var(--spacing-lg)'}}>Documents</h4>
                                    {record?.documents?.length > 0 ? (
                                        <div className="flex flex-column gap-sm">
                                            {record?.documents.map((doc, index) => (
                                                <a key={index} href={doc?.url} target="_blank" rel="noopener noreferrer" className="button button-secondary" style={{justifyContent: 'flex-start'}}>
                                                    📄 {doc?.name}
                                                    <span style={{marginLeft: 'auto'}}>Preview</span> {/* Placeholder for document preview */}
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No documents attached.</p>
                                    )}
                                </div>
                            </div>
                            <div className="record-sidebar">
                                <MilestoneTracker milestones={record?.milestones} />
                                <AuditFeed logs={record?.auditLog} currentUserRole={currentUserRole} />
                            </div>
                        </div>
                    </div>
                );

            case 'EDIT_FORM':
                const recordToEdit = records.find(r => r.id === view.params.id);
                if (!recordToEdit || (currentUserRole !== ROLES.ADMIN && currentUserRole !== ROLES.MANAGER)) {
                    return <div className="container"><p>Access Denied or Record not found.</p></div>;
                }

                return (
                    <div className="container">
                        <Breadcrumbs path={getBreadcrumbs()} onNavigate={setView} />
                        <h2>Edit Record: {recordToEdit?.name}</h2>
                        <div className="bg-card p-lg border-radius-md shadow-light mt-lg">
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveRecord(recordToEdit); }}>
                                <div className="form-group">
                                    <label htmlFor="name" className="form-label">Record Name *</label>
                                    <input type="text" id="name" name="name" className="form-input" defaultValue={recordToEdit?.name} required />
                                    {/* Field-level validation example */}
                                    {/* <p className="form-error">Name is required.</p> */}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="description" className="form-label">Description</label>
                                    <textarea id="description" name="description" className="form-textarea" defaultValue={recordToEdit?.description}></textarea>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="status" className="form-label">Status *</label>
                                    <select id="status" name="status" className="form-select" defaultValue={recordToEdit?.status} required>
                                        <option value="Approved">Approved</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Exception">Exception</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="assignedTo" className="form-label">Assigned To (Auto-populated Example)</label>
                                    <input type="text" id="assignedTo" name="assignedTo" className="form-input" defaultValue={recordToEdit?.assignedTo} readOnly />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="fileUpload" className="form-label">Upload Documents</label>
                                    <input type="file" id="fileUpload" name="fileUpload" className="form-input" multiple />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
                                    <button type="button" className="button button-secondary" onClick={() => setView({ screen: 'RECORD_DETAIL', params: { id: recordToEdit.id } })}>Cancel</button>
                                    <button type="submit" className="button button-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="container text-center mt-lg">
                        <h2>Welcome to Untitled Project!</h2>
                        <p>Use the navigation or global search to get started.</p>
                        <button className="button button-primary mt-lg" onClick={() => setView({ screen: 'DASHBOARD' })}>Go to Dashboard</button>
                    </div>
                );
        }
    };

    return (
        <div className="App">
            <Header onSearch={handleGlobalSearch} onLogoClick={handleLogoClick} />
            <main className="main-content">
                {renderScreen()}
            </main>
        </div>
    );
}

export default App;
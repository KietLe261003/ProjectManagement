import type { Team } from '@/types/Todo/Team';
import type { team_member } from '@/types/Todo/team_member';
import { useFrappeAuth, useFrappeGetDocList } from 'frappe-react-sdk';

export const TeamList = () => {
  const { currentUser } = useFrappeAuth();

  const { data, error, isLoading } = useFrappeGetDocList<Team>('Team', {
    fields: ['name', 'team', 'department', 'team_member'],
    orderBy: { field: 'name', order: 'asc' },
  });
  console.log('Fetched Teams:', data);

  if (isLoading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {JSON.stringify(error)}</div>;

  // Lọc các Team có currentUser trong team_member
  const filteredTeams = data?.filter((team) =>
    team.team_member?.some((member: team_member) => member.user === currentUser)
  );

  if (!filteredTeams || filteredTeams.length === 0) return <div>Không tìm thấy team nào.</div>;

  return (
    <div>
      <h2>Các team của {currentUser}</h2>
      <ul>
        {filteredTeams.map((team) => (
          <li key={team.name}>
            <h3>{team.team} ({team.department})</h3>
            <p>Thành viên:</p>
            <ul>
              {team.team_member?.map((member: team_member) => (
                <li key={member.name}>
                  {member.user} - {member.role}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};